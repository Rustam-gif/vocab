// Quick script to manually refresh premium status
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function checkAndRefresh() {
  try {
    const active = await AsyncStorage.getItem('@engniter.premium.active');
    const product = await AsyncStorage.getItem('@engniter.premium.product');
    
    console.log('[Premium Check]');
    console.log('  Active:', active);
    console.log('  Product:', product);
    
    if (active !== '1') {
      console.log('\nForcing premium status to active...');
      await AsyncStorage.setItem('@engniter.premium.active', '1');
      await AsyncStorage.setItem('@engniter.premium.product', 'com.royal.vocadoo.premium.monthly');
      console.log('Done! Restart the app.');
    } else {
      console.log('\nPremium is already active.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkAndRefresh();
