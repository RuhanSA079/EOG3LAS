/// <reference path="../../../client/src/3las.ts" />
/// <reference path="../../../client/src/3las.webrtc.ts" />
/// <reference path="../../../client/src/fallback/3las.fallback.ts" />
/// <reference path="../../../client/src/fallback/3las.formatreader.ts" />
/// <reference path="../../../client/src/fallback/formats/3las.formatreader.mpeg.ts" />
/// <reference path="../../../client/src/fallback/formats/3las.formatreader.wav.ts" />
/// <reference path="../../../client/src/fallback/3las.liveaudioplayer.ts" />
/// <reference path="../../../client/src/util/3las.helpers.ts" />
/// <reference path="../../../client/src/util/3las.logging.ts" />
/// <reference path="../../../client/src/util/3las.websocketclient.ts" />
var Stream;
var DefaultVolume = 0.5;
function Init(_ev) {
    document.getElementById("logwindowbutton").onclick = OnLogWindowButtonClick;
    var logger = new Logging(document.getElementById("logwindow"), "li");
    // Load default settings
    var settings = new _3LAS_Settings();
    if (typeof RtcConfig == 'undefined')
        RtcConfig = {};
    settings.WebRTC.RtcConfig = RtcConfig;
    if (typeof SocketPort != 'undefined')
        settings.SocketPort = SocketPort;
    if (typeof SocketPath != 'undefined')
        settings.SocketPath = SocketPath;
    if (typeof AudioTagId == 'undefined')
        settings.WebRTC.AudioTag = null;
    else
        settings.WebRTC.AudioTag = document.getElementById(AudioTagId);
    try {
        Stream = new _3LAS(logger, settings);
    }
    catch (_ex) {
        document.getElementById("webaudiounsupported").style.display = "block";
        return;
    }
    Stream.ConnectivityCallback = OnConnectivityCallback;
    Stream.ActivityCallback = OnActivityCallback;
    document.getElementById("unmutebutton").onclick = OnUnmuteButtonClick;
    document.getElementById("mutebutton").onclick = OnMuteButtonClick;
    document.getElementById("playbutton").onclick = OnPlayButtonClick;
    var volumebar = document.getElementById("volumebar");
    volumebar.addEventListener("touchstart", OnVolumeBarDragBegin);
    volumebar.addEventListener("mousedown", OnVolumeBarDragBegin);
    document.getElementById("viewcontainer").style.display = "block";
}
function OnLogWindowButtonClick(_ev) {
    var logwindow = document.getElementById("logwindow");
    logwindow.style.display = (logwindow.style.display == "block" ? "none" : "block");
}
function OnConnectivityCallback(isConnected) {
    if (isConnected) {
        if (DefaultVolume >= 0) {
            Stream.Volume = DefaultVolume;
            DefaultVolume = -1;
        }
        document.getElementById("volumebar").style.visibility = "visible";
        document.getElementById("controlbar").style.visibility = "visible";
        document.getElementById("playbutton").style.visibility = "hidden";
        document.getElementById("mutebutton").style.visibility = "visible";
        document.getElementById("unmutebutton").style.visibility = "hidden";
    }
    else {
        document.getElementById("volumebar").style.visibility = "hidden";
        document.getElementById("controlbar").style.visibility = "hidden";
        document.getElementById("playbutton").style.visibility = "visible";
        document.getElementById("redlighton").style.visibility = "hidden";
        document.getElementById("redlightoff").style.visibility = "visible";
        document.getElementById("mutebutton").style.visibility = "hidden";
        document.getElementById("unmutebutton").style.visibility = "hidden";
    }
}
function OnActivityCallback() {
    var redlighton = document.getElementById("redlighton");
    var redlightoff = document.getElementById("redlightoff");
    if (redlightoff.style.visibility == "hidden") {
        redlightoff.style.visibility = "visible";
        redlighton.style.visibility = "hidden";
    }
    else {
        redlightoff.style.visibility = "hidden";
        redlighton.style.visibility = "visible";
    }
}
var OldVolume = 0;
function OnMuteButtonClick(_ev) {
    document.getElementById("unmutebutton").style.visibility = "visible";
    document.getElementById("mutebutton").style.visibility = "hidden";
    OldVolume = Stream.Volume;
    Stream.Volume = 0.0;
    UpdateVolumeBar(0);
    document.getElementById("audioTag").muted = true;
}
function OnUnmuteButtonClick(_ev) {
    document.getElementById("mutebutton").style.visibility = "visible";
    document.getElementById("unmutebutton").style.visibility = "hidden";
    Stream.Volume = OldVolume;
    UpdateVolumeBar(OldVolume * document.getElementById("volumebar").getBoundingClientRect().width);
    document.getElementById("audioTag").muted = false;
}
function OnPlayButtonClick(_ev) {
    try {
        Stream.Start();
    }
    catch (_ex) {
    }
}
function UpdateVolumeBar(left) {
    document.getElementById("volumeknob").style.left = left + "px";
    document.getElementById("currentvolume").style.width = left + "px";
}
function OnVolumeBarDragBegin(ev) {
    document.getElementById("mutebutton").style.visibility = "visible";
    document.getElementById("unmutebutton").style.visibility = "hidden";
    ev.currentTarget.addEventListener("touchmove", OnVolumeBarDragMove);
    ev.currentTarget.addEventListener("mousemove", OnVolumeBarDragMove);
    ev.currentTarget.addEventListener("touchend", OnVolumeBarDragEnd);
    ev.currentTarget.addEventListener("mouseup", OnVolumeBarDragEnd);
    ev.currentTarget.addEventListener("touchcancel", OnVolumeBarDragLeave);
    ev.currentTarget.addEventListener("mouseleave", OnVolumeBarDragLeave);
    OnVolumeBarDragMove(ev);
}
function OnVolumeBarDragEnd(ev) {
    ev.currentTarget.removeEventListener("touchmove", OnVolumeBarDragMove);
    ev.currentTarget.removeEventListener("mousemove", OnVolumeBarDragMove);
    ev.currentTarget.removeEventListener("touchend", OnVolumeBarDragEnd);
    ev.currentTarget.removeEventListener("mouseup", OnVolumeBarDragEnd);
    ev.currentTarget.removeEventListener("touchcancel", OnVolumeBarDragLeave);
    ev.currentTarget.removeEventListener("mouseleave", OnVolumeBarDragLeave);
    OnVolumeBarDragMove(ev);
}
function OnVolumeBarDragLeave(ev) {
    ev.currentTarget.removeEventListener("touchmove", OnVolumeBarDragMove);
    ev.currentTarget.removeEventListener("mousemove", OnVolumeBarDragMove);
    ev.currentTarget.removeEventListener("touchend", OnVolumeBarDragEnd);
    ev.currentTarget.removeEventListener("mouseup", OnVolumeBarDragEnd);
    ev.currentTarget.removeEventListener("touchcancel", OnVolumeBarDragLeave);
    ev.currentTarget.removeEventListener("mouseleave", OnVolumeBarDragLeave);
}
function OnVolumeBarDragMove(ev) {
    var clientX;
    if (ev instanceof MouseEvent) {
        clientX = ev.clientX;
    }
    else {
        if (ev.touches.length <= 0)
            return;
        clientX = ev.touches[0].clientX;
    }
    var rect = ev.currentTarget.getBoundingClientRect();
    var left = clientX - rect.left;
    if (left < 0)
        left = 0;
    else if (left > rect.width)
        left = rect.width;
    var ratio = left / rect.width;
    UpdateVolumeBar(left);
    Stream.Volume = ratio;
}
//# sourceMappingURL=main.js.map
