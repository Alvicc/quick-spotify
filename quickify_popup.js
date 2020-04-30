window.console.log('This is popping!');
QuickifyPopup = {};

QuickifyPopup.handleStatus = function(request, sender, sendResponse) {
  if (request.type != QuickifyMessages.STATUS) return;
  QuickifyPopup.song.textContent = request.song;
  QuickifyPopup.artist.textContent = request.artist;
  QuickifyPopup.artist.setAttribute("title", request.artist); // Artist display on hover
  QuickifyPopup.playpauseBtn.classList.toggle('pause', request.isPlaying);
  QuickifyPopup.shuffleBtn.classList.toggle('on', request.isShuffled);
  QuickifyPopup.addBtn.classList.toggle('done', request.isSaved);
  QuickifyPopup.artCover.src = request.artCoverUrl;
  
  
  var volumeSize = QuickifyPopup.volumeBar.getBoundingClientRect().height;
  QuickifyPopup.volumeProgress.style.transform = "translateY(" + (volumeSize - (request.currentVolume * volumeSize)) + "px)";
  QuickifyPopup.volumeProgress.style.height = (request.currentVolume * volumeSize);

  switch (request.repeatMode) {
    case "repeat":
      QuickifyPopup.repeatBtn.classList.toggle('repeat', true);
      QuickifyPopup.repeatBtn.classList.toggle('repeatonce', false);
      break;
    case "once":
        QuickifyPopup.repeatBtn.classList.toggle('repeat', false);
        QuickifyPopup.repeatBtn.classList.toggle('repeatonce', true);
      break;
    default:
        QuickifyPopup.repeatBtn.classList.toggle('repeat', false);
        QuickifyPopup.repeatBtn.classList.toggle('repeatonce', false);
      break;
  }

  // Calculate and display time differently for normal and beta players.
  var percent = 0;
  var cTime = parseTime(request.currentTime);
  if (request.songLength) {
    percent = cTime / parseTime(request.songLength);
  } else if (request.remainingTime) {
    percent = cTime / (cTime + parseTime(request.remainingTime));
  }
  QuickifyPopup.setTime(
      request.currentTime,
      request.songLength || request.remainingTime,
      percent);

  // Parse time to set progress accordingly.
  function parseTime(time) {
    var tArr = time.split(':');
    var secs = 0;
    var mult = 1;
    for (var i = tArr.length - 1; i >=0; i--) {
      secs += Number(tArr[i]) * mult;
      mult *= 60;
    }
    return secs;
  };
};

QuickifyPopup.setTime = function(currentTime, songLength, percent) {
  QuickifyPopup.currentTime.textContent = currentTime;
  QuickifyPopup.songLength.textContent = songLength;
  var newWidth = percent * QuickifyPopup.trackProgressBar.getBoundingClientRect().width;
  QuickifyPopup.timeProgress.style.width = Math.round(newWidth) + 'px';
  QuickifyPopup.trackProgressKnob.style.transform = "translateX(" + newWidth + "px)";
};


// Change the volume from te mouse position over the volume bar
QuickifyPopup.setVolume = function(mouseY) {
  var bottom = QuickifyPopup.volumeBar.getBoundingClientRect().bottom;
  var height = QuickifyPopup.volumeBar.getBoundingClientRect().height;
  var volume = (bottom - mouseY) / height;
  QuickifySendToContent({'command' : QuickifyMessages.CHANGE_VOLUME, 'volume' : volume});
};

// Change the track progress from te mouse position over the track progress bar
QuickifyPopup.sendTrackProgress = function(mouseX){
  var left = QuickifyPopup.trackProgressBar.getBoundingClientRect().left;
  var width = QuickifyPopup.trackProgressBar.getBoundingClientRect().width;
  var progress = (mouseX - left) / width;
  console.log("Set progress : " + progress);
  QuickifySendToContent({'command' : QuickifyMessages.CHANGE_TRACK_PROGRESS, 'progress' : progress});
};

QuickifyPopup.init = function() {
  QuickifyPopup.song = document.getElementById('song');
  QuickifyPopup.artist = document.getElementById('artist');
  QuickifyPopup.prevBtn = document.getElementById('prev');
  QuickifyPopup.nextBtn = document.getElementById('next');
  QuickifyPopup.playpauseBtn = document.getElementById('playpause');
  QuickifyPopup.addBtn = document.getElementById('add');
  QuickifyPopup.shuffleBtn = document.getElementById('shuffle');
  QuickifyPopup.repeatBtn = document.getElementById('repeat');
  QuickifyPopup.currentTime = document.getElementById('current');
  QuickifyPopup.timeProgress = document.getElementById('progress');
  QuickifyPopup.songLength = document.getElementById('end');
  // QuickifyPopup.openLinkBtn = document.getElementById('link');
  QuickifyPopup.artCover = document.getElementById('artCover');
  QuickifyPopup.volumeBar = document.getElementById('volume-bar');
  QuickifyPopup.volumeProgress = document.getElementById('volume-progress');
  QuickifyPopup.volumeKnob = document.getElementById("volume-knob");
  QuickifyPopup.mouseDownOnVolume = false;
  QuickifyPopup.trackProgressBar = document.getElementById("track-progress-bar");
  QuickifyPopup.trackProgressKnob = document.getElementById("progress-knob");
  QuickifyPopup.mouseDownOnTrackProgressBar = false;

  QuickifyPopup.styleFolder = "style/";

  let theme = localStorage.getItem("currentTheme");
  if(!theme) {
    localStorage.setItem("currentTheme", QuickifyThemes.DEFAULT);
  }
  QuickifyPopup.currentTheme =  theme || QuickifyThemes.DEFAULT;

  QuickifyPopup.setTheme(QuickifyPopup.currentTheme);

  // Add listeners for buttons.
  QuickifyPopup.prevBtn.addEventListener('click', function() {
    QuickifySendToContent({'command' : QuickifyMessages.PREVIOUS});
  });
  QuickifyPopup.nextBtn.addEventListener('click', function() {
    QuickifySendToContent({'command' : QuickifyMessages.NEXT});
  });
  QuickifyPopup.playpauseBtn.addEventListener('click', function() {
    QuickifySendToContent({'command' : QuickifyMessages.PLAY_OR_PAUSE});
  });
  QuickifyPopup.addBtn.addEventListener('click', function() {
    QuickifySendToContent({'command' : QuickifyMessages.SAVE});
  });
  QuickifyPopup.shuffleBtn.addEventListener('click', function() {
    QuickifySendToContent({'command' : QuickifyMessages.SHUFFLE});
  });
  QuickifyPopup.repeatBtn.addEventListener('click', function() {
    QuickifySendToContent({'command' : QuickifyMessages.REPEAT});
  });
  // QuickifyPopup.openLinkBtn.addEventListener('click', function() {
  //   browser.tabs.query({url: QuickifyUrl},
  //     function(tabs) {
  //       if (tabs.length) {
  //         browser.tabs.update(tabs[0].id, {active: true});
  //       }
  //     });
  // });


  // Volume event listeners
  QuickifyPopup.volumeBar.addEventListener('mousedown', function(event) {
    QuickifyPopup.mouseDownOnVolume = true;
    QuickifyPopup.volumeProgress.classList.toggle('active', true);
    QuickifyPopup.setVolume(event.clientY);
  });
  
  QuickifyPopup.volumeBar.addEventListener('mouseover', function() {
    QuickifyPopup.volumeKnob.style.visibility = 'visible';
    QuickifyPopup.volumeProgress.classList.toggle('active', true);
  });
  
  QuickifyPopup.volumeBar.addEventListener('mouseleave', function() {
    if(!QuickifyPopup.mouseDownOnVolume){
      QuickifyPopup.volumeKnob.style.visibility = 'hidden';
      QuickifyPopup.volumeProgress.classList.toggle('active', false);
    }
  });
  
  // Track progrress event listener
  QuickifyPopup.trackProgressBar.addEventListener('mousedown', function(event){
    QuickifyPopup.mouseDownOnTrackProgressBar = true;
    QuickifyPopup.sendTrackProgress(event.clientX);
  });
  
  QuickifyPopup.trackProgressBar.addEventListener('mouseover', function() {
    QuickifyPopup.timeProgress.classList.toggle('active', true);
    QuickifyPopup.trackProgressKnob.style.visibility = 'visible';  
  });
  
  QuickifyPopup.trackProgressBar.addEventListener('mouseleave', function() {
    if(!QuickifyPopup.mouseDownOnTrackProgressBar){
      QuickifyPopup.timeProgress.classList.toggle('active', false);
      QuickifyPopup.trackProgressKnob.style.visibility = 'hidden';
    }
  });

  // Document event listener
  document.addEventListener('mouseup', function(){
    QuickifyPopup.mouseDownOnVolume = false;
    QuickifyPopup.mouseDownOnTrackProgressBar = false;
    QuickifyPopup.volumeKnob.style.visibility = 'hidden';
    QuickifyPopup.trackProgressKnob.style.visibility = 'hidden';
    QuickifyPopup.timeProgress.classList.toggle('active', false);
    QuickifyPopup.volumeProgress.classList.toggle('active', false);
  });
  
  document.addEventListener('mousemove', function(e){
    
    // Allows to drag the volume and track progress sliders
    if(QuickifyPopup.mouseDownOnVolume){
      QuickifyPopup.setVolume(e.clientY);
    }
    if(QuickifyPopup.mouseDownOnTrackProgressBar){
      QuickifyPopup.sendTrackProgress(e.clientX);
    }

  });
  
  // Set up update listener.
  browser.runtime.onMessage.addListener(QuickifyPopup.handleStatus);


  // Notify content we have started.
  QuickifySendToContent({'command' : QuickifyMessages.POPUP_ON});
};

QuickifyPopup.exit = function() {
  QuickifySendToContent({'command' : QuickifyMessages.POPUP_OFF});
};

QuickifyPopup.setTheme = function(theme) {
  let sheet = QuickifyPopup.styleFolder + theme + "/theme.css";
  document.getElementById("theme-sheet").setAttribute("href", sheet);
};

window.onload = QuickifyPopup.init;
// TODO: This isn't working, nbd but should figure it out eventually.
window.onbeforeunload = QuickifyPopup.exit;
