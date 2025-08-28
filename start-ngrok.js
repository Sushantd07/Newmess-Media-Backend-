import ngrok from 'ngrok';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function startNgrok() {
  try {
    const url = await ngrok.connect({
      addr: process.env.PORT || 3000,
      authtoken: process.env.NGROK_AUTH_TOKEN,
      subdomain: process.env.NGROK_SUBDOMAIN,
      region: 'us'
    });
    
    console.log('🌍 Ngrok tunnel is active!');
    console.log(`🔗 Public URL: ${url}`);
    console.log(`📊 Ngrok dashboard: http://localhost:4040`);
    
    // Update environment variable
    process.env.NGROK_URL = url;
    
    // Keep the tunnel alive
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down ngrok tunnel...');
      await ngrok.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start ngrok:', error.message);
    process.exit(1);
  }
}

startNgrok(); 