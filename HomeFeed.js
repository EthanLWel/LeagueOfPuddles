import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import {
  collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove,
  query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';

const { width } = Dimensions.get('window');
const POST_WIDTH = width - 32;
const GRID_SIZE = (width - 4) / 3;

export default function HomeFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersForSearch, setAllUsersForSearch] = useState([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingSent, setPendingSent] = useState([]);

  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxRequests, setInboxRequests] = useState([]);

  const [profilePage, setProfilePage] = useState(null);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [profilePhotosLoading, setProfilePhotosLoading] = useState(false);

  const [profileModal, setProfileModal] = useState(null);

  const unsubInboxRef = useRef(null);
  const unsubSentRef = useRef(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        loadFriendsAndUsers(user.uid);
        unsubInboxRef.current = subscribeToInbox(user.uid);
        unsubSentRef.current = subscribeToSentRequests(user.uid);
      }
    });
    return () => {
      unsubAuth();
      unsubInboxRef.current?.();
      unsubSentRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (allUsers.length > 0) loadFeed();
  }, [allUsers, friends]);

  const subscribeToInbox = (uid) => {
    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    );
    return onSnapshot(q, (snapshot) => {
      setInboxRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  };

  const subscribeToSentRequests = (uid) => {
    const q = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', uid),
      where('status', '==', 'pending')
    );
    return onSnapshot(q, (snapshot) => {
      setPendingSent(snapshot.docs.map(d => d.data().toUid));
    });
  };

  const loadFriendsAndUsers = async (uid) => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allFromFirestore = usersSnapshot.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => u.uid !== uid);

      setAllUsersForSearch(allFromFirestore);
      setAllUsers(allFromFirestore);

      const myDoc = await getDoc(doc(db, 'users', uid));
      if (myDoc.exists()) setFriends(myDoc.data().friends || []);
    } catch (e) {
      console.error('Error loading users:', e);
      setLoading(false);
    }
  };

  const loadFeed = async () => {
    try {
      const allPosts = [];
      await Promise.all(
        allUsers.map(async (user) => {
          try {
            // Fetch pfpUrl from Firestore user doc
            let pfpUrl = user.pfpUrl ?? null;
            if (!pfpUrl) {
              try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) pfpUrl = userDoc.data().pfpUrl ?? null;
              } catch (e) {}
            }

            const userPhotosRef = ref(storage, `photos/${user.uid}/`);
            const result = await listAll(userPhotosRef);
            const urls = await Promise.all(
              result.items.map(async (item) => {
                const url = await getDownloadURL(item);
                return {
                  id: item.fullPath,
                  imageUrl: url,
                  username: user.username || 'unknown',
                  uid: user.uid,
                  pfpUrl,
                  timestamp: parseInt(item.name.replace('.jpg', '')) || 0,
                  isFriend: friends.includes(user.uid),
                };
              })
            );
            allPosts.push(...urls);
          } catch (e) { /* no photos yet */ }
        })
      );

      allPosts.sort((a, b) => {
        if (a.isFriend && !b.isFriend) return -1;
        if (!a.isFriend && b.isFriend) return 1;
        return b.timestamp - a.timestamp;
      });

      setPosts(allPosts);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadProfilePhotos = async (uid) => {
    setProfilePhotosLoading(true);
    try {
      const userPhotosRef = ref(storage, `photos/${uid}/`);
      const result = await listAll(userPhotosRef);
      const urls = await Promise.all(result.items.map(item => getDownloadURL(item)));
      setProfilePhotos(urls);
    } catch (e) {
      setProfilePhotos([]);
    } finally {
      setProfilePhotosLoading(false);
    }
  };

  const openProfilePage = (user) => {
    setProfilePage(user);
    setProfilePhotos([]);
    loadProfilePhotos(user.uid);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const closeProfilePage = () => {
    setProfilePage(null);
    setProfilePhotos([]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    const uid = auth.currentUser?.uid;
    if (uid) loadFriendsAndUsers(uid);
  };

  const searchResults = searchQuery.trim()
    ? allUsersForSearch.filter(u =>
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  const sendFriendRequest = async (targetUid) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;
    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUid: currentUid,
        toUid: targetUid,
        fromUsername: auth.currentUser.displayName || 'unknown',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to send request:', e);
    }
  };

  const cancelRequest = async (targetUid) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;
    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('fromUid', '==', currentUid),
        where('toUid', '==', targetUid),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'friendRequests', d.id))));
    } catch (e) {
      console.error('Failed to cancel request:', e);
    }
  };

  const acceptRequest = async (request) => {
    const currentUid = auth.currentUser?.uid;
    try {
      await updateDoc(doc(db, 'users', currentUid), { friends: arrayUnion(request.fromUid) });
      await updateDoc(doc(db, 'users', request.fromUid), { friends: arrayUnion(currentUid) });
      await deleteDoc(doc(db, 'friendRequests', request.id));
      setFriends(prev => [...prev, request.fromUid]);
    } catch (e) {
      console.error('Failed to accept request:', e);
    }
  };

  const declineRequest = async (request) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', request.id));
    } catch (e) {
      console.error('Failed to decline request:', e);
    }
  };

  const removeFriend = async (targetUid) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;
    try {
      await updateDoc(doc(db, 'users', currentUid), { friends: arrayRemove(targetUid) });
      await updateDoc(doc(db, 'users', targetUid), { friends: arrayRemove(currentUid) });
      setFriends(prev => prev.filter(uid => uid !== targetUid));
    } catch (e) {
      console.error('Failed to remove friend:', e);
    }
  };

  const getButtonState = (uid) => {
    if (friends.includes(uid)) return 'friends';
    if (pendingSent.includes(uid)) return 'pending';
    return 'none';
  };

  const FriendButton = ({ uid, onAction }) => {
    const state = getButtonState(uid);
    if (state === 'friends') return (
      <TouchableOpacity
        style={[styles.addBtn, styles.addBtnAdded]}
        onPress={() => { removeFriend(uid); onAction?.(); }}
      >
        <Text style={styles.addBtnTextAdded}>Friends ✓</Text>
      </TouchableOpacity>
    );
    if (state === 'pending') return (
      <TouchableOpacity
        style={[styles.addBtn, styles.addBtnPending]}
        onPress={() => { cancelRequest(uid); onAction?.(); }}
      >
        <Text style={styles.addBtnTextPending}>Pending…</Text>
      </TouchableOpacity>
    );
    return (
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => { sendFriendRequest(uid); onAction?.(); }}
      >
        <Text style={styles.addBtnText}>+ Add Friend</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerSideBtn} />
            <Image source={require('./waddl/Prettier/New_name.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.headerSideBtn} />
          </View>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#29412c" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerSideBtn}
            onPress={() => setSearchOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image source={require('./waddl/Prettier/Search.png')} style={styles.headerIconImg} resizeMode="contain" />
          </TouchableOpacity>
          <Image source={require('./waddl/Prettier/New_name.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity
            style={styles.headerSideBtn}
            onPress={() => setInboxOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require('./waddl/Prettier/Mail.png')}
              style={styles.headerIconImg}
              resizeMode="contain"
            />
            {inboxRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{inboxRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No posts from others yet</Text>
          <Text style={styles.emptySubtext}>Search for friends to see their puddle adventures!</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#29412c" />}
        >
          {posts.map((post) => (
            <View key={post.id} style={styles.post}>
              <TouchableOpacity
                style={styles.postHeader}
                onPress={() => setProfileModal({ uid: post.uid, username: post.username, pfpUrl: post.pfpUrl })}
                activeOpacity={0.7}
              >
                <View style={styles.profilePic}>
                  {post.pfpUrl ? (
                    <Image source={{ uri: post.pfpUrl }} style={styles.profilePicImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.profileInitial}>
                      {(post.username || '?')[0].toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.username}>@{post.username}</Text>
                {post.isFriend && (
                  <View style={styles.friendBadge}>
                    <Text style={styles.friendBadgeText}>friend</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Search Modal ── */}
      <Modal
        visible={searchOpen}
        animationType="slide"
        transparent
        onRequestClose={() => { setSearchOpen(false); setSearchQuery(''); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlayNoBg}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheetFullScreen}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Find Friends</Text>
              <TouchableOpacity onPress={() => { setSearchOpen(false); setSearchQuery(''); }}>
                <Image source={require('./waddl/Prettier/X-Out.png')} style={styles.closeIcon} resizeMode="contain" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              autoCapitalize="none"
              returnKeyType="search"
            />

            {searchQuery.trim() === '' ? (
              <View style={styles.searchPrompt}>
                <Text style={styles.searchPromptText}>Type a username to search</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.searchPrompt}>
                <Text style={styles.searchPromptText}>No users found for "{searchQuery}"</Text>
              </View>
            ) : (
              <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
                {searchResults.map((user) => (
                  <TouchableOpacity
                    key={user.uid}
                    style={styles.resultRow}
                    onPress={() => openProfilePage(user)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.resultPic}>
                      {user.pfpUrl ? (
                        <Image source={{ uri: user.pfpUrl }} style={styles.resultPicImage} resizeMode="cover" />
                      ) : (
                        <Text style={styles.resultInitial}>
                          {(user.username || '?')[0].toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultUsername}>@{user.username}</Text>
                      <Text style={styles.resultBio} numberOfLines={1}>
                        {user.bio || 'No bio yet'}
                      </Text>
                    </View>
                    <Text style={styles.resultChevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Inbox Modal ── */}
      <Modal
        visible={inboxOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setInboxOpen(false)}
      >
        <View style={styles.modalOverlayNoBg}>
          <View style={styles.modalSheetFullScreen}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Friend Requests</Text>
              <TouchableOpacity onPress={() => setInboxOpen(false)}>
                <Image source={require('./waddl/Prettier/X-Out.png')} style={styles.closeIcon} resizeMode="contain" />
              </TouchableOpacity>
            </View>

            {inboxRequests.length === 0 ? (
              <View style={styles.searchPrompt}>
                <Image source={require('./waddl/Prettier/No_mail.png')} style={styles.emptyInboxImage} resizeMode="contain" />
                <Text style={styles.searchPromptText}>No pending requests</Text>
              </View>
            ) : (
              <ScrollView style={styles.resultsList}>
                {inboxRequests.map((request) => (
                  <View key={request.id} style={styles.resultRow}>
                    <View style={styles.resultPic}>
                      <Text style={styles.resultInitial}>
                        {(request.fromUsername || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultUsername}>@{request.fromUsername}</Text>
                      <Text style={styles.resultBio}>wants to be your friend</Text>
                    </View>
                    <View style={styles.inboxActions}>
                      <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(request)}>
                        <Text style={styles.acceptBtnText}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.declineBtn} onPress={() => declineRequest(request)}>
                        <Text style={styles.declineBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Full Profile Page Modal ── */}
      <Modal
        visible={!!profilePage}
        animationType="slide"
        onRequestClose={closeProfilePage}
      >
        <View style={styles.profilePageContainer}>
          <View style={styles.profilePageHeader}>
            <TouchableOpacity onPress={closeProfilePage} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.profilePageTitle}>@{profilePage?.username}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.profilePageContent}>
            <View style={styles.profilePageTop}>
              <View style={styles.profilePageAvatar}>
                {profilePage?.pfpUrl ? (
                  <Image source={{ uri: profilePage.pfpUrl }} style={styles.profilePageAvatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.profilePageInitial}>
                    {(profilePage?.username || '?')[0].toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.profilePageUsername}>@{profilePage?.username}</Text>
              {profilePage?.bio ? (
                <Text style={styles.profilePageBio}>{profilePage.bio}</Text>
              ) : null}
              <View style={{ marginTop: 14 }}>
                {profilePage && <FriendButton uid={profilePage.uid} />}
              </View>
            </View>

            <View style={styles.profilePageDivider} />
            {profilePhotosLoading ? (
              <View style={styles.profilePhotosLoading}>
                <ActivityIndicator size="large" color="#29412c" />
              </View>
            ) : profilePhotos.length === 0 ? (
              <View style={styles.profilePhotosEmpty}>
                <Text style={styles.profilePhotosEmptyIcon}>🌧️</Text>
                <Text style={styles.profilePhotosEmptyText}>No puddles yet</Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {profilePhotos.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.gridPhoto} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Feed post tap modal ── */}
      <Modal
        visible={!!profileModal}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileModal(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfileModal(null)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>@{profileModal?.username}</Text>
              <TouchableOpacity onPress={() => setProfileModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileModalBody}>
              <View style={styles.profileModalAvatar}>
                {profileModal?.pfpUrl ? (
                  <Image source={{ uri: profileModal.pfpUrl }} style={styles.profileModalAvatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.profileModalInitial}>
                    {(profileModal?.username || '?')[0].toUpperCase()}
                  </Text>
                )}
              </View>
              {profileModal && (
                <View style={{ marginTop: 16 }}>
                  <FriendButton uid={profileModal.uid} onAction={() => setProfileModal(null)} />
                </View>
              )}
              <TouchableOpacity
                style={styles.viewProfileBtn}
                onPress={() => {
                  const user = allUsersForSearch.find(u => u.uid === profileModal?.uid);
                  if (user) { setProfileModal(null); openProfilePage(user); }
                }}
              >
                <Text style={styles.viewProfileBtnText}>View full profile →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e4e1d3' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#29412c',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSideBtn: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 24 },
  headerIconImg: { width: 50, height: 50 },
  logo: { height: 90, width: 240 },

  badge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#e63946',
    borderRadius: 10, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: 'LilitaOne_400Regular' },

  feed: { flex: 1 },
  feedContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  post: { marginBottom: 20, backgroundColor: '#d6d3c4', borderRadius: 16, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  profilePic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#29412c',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    overflow: 'hidden',
  },
  profilePicImage: { width: '100%', height: '100%' },
  profileInitial: { fontSize: 18, fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3' },
  username: { fontSize: 14, fontFamily: 'LilitaOne_400Regular', color: '#29412c', flex: 1 },
  friendBadge: { backgroundColor: '#29412c', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  friendBadgeText: { fontSize: 11, fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3' },
  postImage: { width: POST_WIDTH, height: POST_WIDTH },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontSize: 24, fontFamily: 'LilitaOne_400Regular', color: '#333', marginBottom: 10 },
  emptySubtext: { fontSize: 16, fontFamily: 'LilitaOne_400Regular', color: '#999', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalOverlayNoBg: { flex: 1, justifyContent: 'flex-end', paddingTop: 150 },
  modalSheet: {
    backgroundColor: '#e4e1d3',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
    maxHeight: '80%',
  },
  modalSheetFullScreen: {
    backgroundColor: '#e4e1d3',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
    flex: 1,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: 'LilitaOne_400Regular', color: '#29412c' },
  modalClose: { fontSize: 22, color: '#29412c', fontFamily: 'LilitaOne_400Regular' },
  closeIcon: { width: 24, height: 24 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    fontSize: 15, fontFamily: 'LilitaOne_400Regular', color: '#333',
    borderWidth: 1, borderColor: '#d0cdb8', marginBottom: 12,
  },
  searchPrompt: { alignItems: 'center', paddingTop: 30, gap: 12 },
  searchPromptText: { fontSize: 15, fontFamily: 'LilitaOne_400Regular', color: '#999' },
  emptyInboxIcon: { fontSize: 48 },
  emptyInboxImage: { width: 250, height: 250 },
  resultsList: { maxHeight: 400 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#d0cdb8' },
  resultPic: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#29412c',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
    overflow: 'hidden',
  },
  resultPicImage: { width: '100%', height: '100%' },
  resultInitial: { fontSize: 20, fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3' },
  resultInfo: { flex: 1 },
  resultUsername: { fontSize: 15, fontFamily: 'LilitaOne_400Regular', color: '#29412c' },
  resultBio: { fontSize: 12, fontFamily: 'LilitaOne_400Regular', color: '#999', marginTop: 2 },
  resultChevron: { fontSize: 22, color: '#29412c', fontFamily: 'LilitaOne_400Regular', paddingLeft: 8 },

  addBtn: { backgroundColor: '#29412c', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnAdded: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#29412c' },
  addBtnPending: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#999' },
  addBtnText: { fontSize: 14, fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3' },
  addBtnTextAdded: { fontSize: 14, fontFamily: 'LilitaOne_400Regular', color: '#29412c' },
  addBtnTextPending: { fontSize: 14, fontFamily: 'LilitaOne_400Regular', color: '#999' },

  inboxActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#29412c',
    justifyContent: 'center', alignItems: 'center',
  },
  acceptBtnText: { color: '#e4e1d3', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },
  declineBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: '#e63946',
    justifyContent: 'center', alignItems: 'center',
  },
  declineBtnText: { color: '#e63946', fontSize: 16, fontFamily: 'LilitaOne_400Regular' },

  profilePageContainer: { flex: 1, backgroundColor: '#e4e1d3' },
  profilePageHeader: {
    backgroundColor: '#29412c',
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { width: 60 },
  backBtnText: { fontSize: 15, fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3' },
  profilePageTitle: { fontSize: 18, fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3' },
  profilePageContent: { paddingBottom: 40 },
  profilePageTop: { alignItems: 'center', paddingTop: 30, paddingBottom: 24, paddingHorizontal: 24 },
  profilePageAvatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#29412c',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12, overflow: 'hidden',
  },
  profilePageAvatarImage: { width: '100%', height: '100%' },
  profilePageInitial: { fontSize: 40, fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3' },
  profilePageUsername: { fontSize: 22, fontFamily: 'LilitaOne_400Regular', color: '#29412c', marginBottom: 6 },
  profilePageBio: { fontSize: 14, fontFamily: 'LilitaOne_400Regular', color: '#666', textAlign: 'center', lineHeight: 20 },
  profilePageDivider: { height: 1, backgroundColor: '#d0cdb8', marginHorizontal: 16, marginBottom: 2 },

  profilePhotosLoading: { paddingTop: 40, alignItems: 'center' },
  profilePhotosEmpty: { paddingTop: 40, alignItems: 'center', gap: 10 },
  profilePhotosEmptyIcon: { fontSize: 48 },
  profilePhotosEmptyText: { fontSize: 15, fontFamily: 'LilitaOne_400Regular', color: '#999' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridPhoto: { width: Math.floor((width - 12) / 3), height: Math.floor((width - 12) / 3), margin: 2 },

  profileModalBody: { alignItems: 'center', paddingVertical: 20 },
  profileModalAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#29412c',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  profileModalAvatarImage: { width: '100%', height: '100%' },
  profileModalInitial: { fontSize: 36, fontFamily: 'LilitaOne_400Regular', color: '#e4e1d3' },
  viewProfileBtn: { marginTop: 14 },
  viewProfileBtnText: { fontSize: 14, fontFamily: 'LilitaOne_400Regular', color: '#29412c' },
});