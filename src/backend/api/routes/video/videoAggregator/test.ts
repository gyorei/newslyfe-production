import { videoAggregator, YouTubeFeedConfig, getAllChannelConfigs } from './videoAggregator.js';

/**
 * Test YouTube Video Aggregator
 */
async function testYouTubeAggregator() {
  console.log('🧪 Testing YouTube Video Aggregator...\n');

  try {
    // Test single channel
    const bbcConfig: YouTubeFeedConfig = {
      channelId: 'UC16niRr50-MSBwiO3YDb3RA',
      channelName: 'BBC News',
      maxVideos: 3, // Limit for testing
    };

    console.log('📺 Testing BBC News channel...');
    const bbcVideos = await videoAggregator.fetchYouTubeFeed(bbcConfig);
    
    console.log(`✅ BBC News: ${bbcVideos.length} videos fetched`);
    
    if (bbcVideos.length > 0) {
      const firstVideo = bbcVideos[0];
      console.log('\n📋 Sample video data:');
      console.log(`- Title: ${firstVideo.title}`);
      console.log(`- Video ID: ${firstVideo.videoId}`);
      console.log(`- Link: ${firstVideo.link}`);
      console.log(`- Thumbnail: ${firstVideo.thumbnail}`);
      console.log(`- Views: ${firstVideo.views || 'N/A'}`);
      console.log(`- Published: ${firstVideo.published}`);
      console.log(`- Author: ${firstVideo.author}`);
    }

    // Test multiple channels
    console.log('\n📺 Testing multiple channels...');
    const configs = getAllChannelConfigs(3, 30).slice(0, 2); // Test first 2 channels
    const allVideos = await videoAggregator.fetchMultipleChannels(configs);
    
    console.log(`✅ Multiple channels: ${allVideos.length} total videos fetched`);
    
    // Group by channel
    const videosByChannel = allVideos.reduce((acc, video) => {
      if (!acc[video.channelName]) {
        acc[video.channelName] = [];
      }
      acc[video.channelName].push(video);
      return acc;
    }, {} as Record<string, typeof allVideos>);

    console.log('\n📊 Videos by channel:');
    Object.entries(videosByChannel).forEach(([channel, videos]) => {
      console.log(`- ${channel}: ${videos.length} videos`);
    });

    console.log('\n✅ YouTube Video Aggregator test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testYouTubeAggregator();
}

export { testYouTubeAggregator };

describe('videoAggregator', () => {
  it('should run', () => {
    // ide kerülnek majd a tesztek
  });
});