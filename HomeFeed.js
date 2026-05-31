import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeFeed() {
  // Static feed showing posts from other users/friends
  const friendPosts = [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('./waddl/Pretty/Top_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Feed */}
      {friendPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No posts from friends yet</Text>
          <Text style={styles.emptySubtext}>Connect with friends to see their puddle adventures!</Text>
        </View>
      ) : (
        <ScrollView style={styles.feed}>
          {friendPosts.map((post, index) => (
            <View key={index} style={styles.post}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.profileInfo}>
                  <View style={styles.profilePic}>
                    <Text style={styles.profileInitial}>{post.avatar}</Text>
                  </View>
                  <View>
                    <Text style={styles.username}>@{post.username}</Text>
                    <Text style={styles.location}>{post.location}</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Text style={styles.moreIcon}>⋯</Text>
                </TouchableOpacity>
              </View>

              {/* Post Image */}
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: post.imageUri }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>❤️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>📤</Text>
                </TouchableOpacity>
              </View>

              {/* Post Info */}
              <View style={styles.postInfo}>
                <Text style={styles.likes}>{post.likes} likes</Text>
                <Text style={styles.caption}>
                  <Text style={styles.captionUsername}>@{post.username}</Text> {post.caption}
                </Text>
                <Text style={styles.timeAgo}>{post.timeAgo} ago</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e4e1d3',
  },
  header: {
    backgroundColor: '#29412c',
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    height: 100,
    width: 300,
  },
  feed: {
    flex: 1,
  },
  post: {
    marginBottom: 20,
    backgroundColor: '#e4e1d3',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  profileInitial: {
    fontSize: 20,
    fontFamily: 'LilitaOne_400Regular',
  },
  username: {
    fontSize: 14,
    fontFamily: 'LilitaOne_400Regular',
    color: '#000',
  },
  location: {
    fontSize: 12,
    fontFamily: 'LilitaOne_400Regular',
    color: '#666',
  },
  moreIcon: {
    fontSize: 24,
    color: '#000',
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 24,
    fontFamily: 'LilitaOne_400Regular',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'LilitaOne_400Regular',
    color: '#999',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  actionButton: {
    marginRight: 15,
  },
  actionIcon: {
    fontSize: 24,
  },
  postInfo: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  likes: {
    fontSize: 14,
    fontFamily: 'LilitaOne_400Regular',
    color: '#000',
    marginBottom: 5,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'LilitaOne_400Regular',
    color: '#000',
    marginBottom: 5,
  },
  captionUsername: {
    fontFamily: 'LilitaOne_400Regular',
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: 'LilitaOne_400Regular',
    color: '#999',
  },
});
