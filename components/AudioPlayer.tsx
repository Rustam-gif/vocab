import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface AudioPlayerProps {}

export interface AudioPlayerRef {
  play: (url: string, onComplete?: () => void) => void;
  stop: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const onCompleteCallbackRef = useRef<(() => void) | null>(null);

  useImperativeHandle(ref, () => ({
    play: (url: string, onComplete?: () => void) => {
      console.log('[AudioPlayer] Starting playback for:', url.substring(0, 80) + '...');

      onCompleteCallbackRef.current = onComplete || null;

      // Inject JavaScript to play new audio
      const js = `
        (function() {
          // Stop and remove old audio if exists
          var oldAudio = document.getElementById('audio');
          if (oldAudio) {
            oldAudio.pause();
            setTimeout(function() {
              if (oldAudio && oldAudio.parentNode) {
                oldAudio.remove();
              }
            }, 100);
          }

          // Create new audio element
          var audio = document.createElement('audio');
          audio.id = 'audio';
          audio.preload = 'auto';

          var source = document.createElement('source');
          source.src = "${url.replace(/"/g, '\\"')}";
          source.type = 'audio/mpeg';
          audio.appendChild(source);

          document.body.appendChild(audio);

          var hasStartedPlaying = false;
          var endTimeout = null;
          var isReady = false;
          var isDataLoaded = false;

          // Wait for both canplaythrough AND loadeddata before playing
          audio.addEventListener('loadeddata', function() {
            isDataLoaded = true;
            checkReadyToPlay();
          }, { once: true });

          audio.addEventListener('canplaythrough', function() {
            isReady = true;
            checkReadyToPlay();
          }, { once: true });

          function checkReadyToPlay() {
            if (hasStartedPlaying || !isReady || !isDataLoaded) return;
            hasStartedPlaying = true;

            // Longer delay to ensure full buffering (800ms)
            setTimeout(function() {
              audio.play().then(function() {
                var duration = audio.duration || 3;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: 'started',
                  duration: duration
                }));

                // Very long backup timeout with 3 seconds extra buffer to ensure full playback
                endTimeout = setTimeout(function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'ended' }));
                }, (duration + 3) * 1000);
              }).catch(function(err) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'play_error', error: err.message }));
              });
            }, 800);
          }

          audio.addEventListener('ended', function() {
            if (endTimeout) clearTimeout(endTimeout);
            // Very long buffer after natural end (800ms) to ensure complete playback
            setTimeout(function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'ended' }));
              // Keep audio element in DOM for longer
              setTimeout(function() {
                if (audio && audio.parentNode) {
                  audio.remove();
                }
              }, 300);
            }, 800);
          });

          audio.addEventListener('error', function(e) {
            if (endTimeout) clearTimeout(endTimeout);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'audio_error',
              error: 'playback failed'
            }));
          });

          audio.load();
        })();
      `;

      webViewRef.current?.injectJavaScript(js);
    },
    stop: () => {
      console.log('[AudioPlayer] Stopping audio');
      onCompleteCallbackRef.current = null;

      webViewRef.current?.injectJavaScript(`
        var audio = document.getElementById('audio');
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      `);
    }
  }));

  const initialHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <script>
          window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'webview_ready' }));
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ width: 1, height: 1, opacity: 0, position: 'absolute', top: -1000 }}>
      <WebView
        ref={webViewRef}
        source={{ html: initialHtml }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.event === 'started') {
              console.log('[AudioPlayer] Playback started, duration:', data.duration);
            } else if (data.event === 'ended') {
              console.log('[AudioPlayer] Playback ended');
              if (onCompleteCallbackRef.current) {
                onCompleteCallbackRef.current();
                onCompleteCallbackRef.current = null;
              }
            } else if (data.event === 'audio_error' || data.event === 'play_error') {
              console.error('[AudioPlayer] Error:', data.error || 'Unknown error');
              onCompleteCallbackRef.current = null;
            }
          } catch (e) {
            console.error('[AudioPlayer] Failed to parse message:', e);
          }
        }}
      />
    </View>
  );
});

export default AudioPlayer;
