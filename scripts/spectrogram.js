(function(root) {
  'use strict';

  function _isFunction(v) { return typeof v === 'function'; }

  function _result(v) { return _isFunction(v) ? v() : v; }

  function Spectrogram(canvas, options) {
    if (!(this instanceof Spectrogram)) return new Spectrogram(canvas, options);
    var baseCanvasOptions = options.canvas || {};
    this._audioEnded = null;
    this._paused = null;
    this._pausedAt = null;
    this._startedAt = null;
    this._sources = {
      audioBufferStream: null
    };
    this._baseCanvas = canvas;
    this._baseCanvas.width = _result(baseCanvasOptions.width) || this._baseCanvas.width;
    this._baseCanvas.height = _result(baseCanvasOptions.height) || this._baseCanvas.height;
    var colors = [];
    if (typeof options.colors === 'function') colors = options.colors(275);
    else colors = this._generateDefaultColors(275);
    this._colors = colors;
  }

  var width = 0;
  Spectrogram.prototype._draw = function(array, canvasContext) {
      if (this._paused || this._audioEnded) { return false; }
      else{
        var canvas = canvasContext.canvas;
        canvas.style.background="blue";
        for (var i = 0; i < array.length; i++) {
          if(array[i]!=0){
            canvasContext.fillStyle = this._getColor(array[i]);
            canvasContext.fillRect(width, canvas.height-i*2, canvas.width/(46750*(media.slice.end-media.slice.start)/1000/256), 2);
          }
        }
        width+=canvas.width/(46750*(media.slice.end-media.slice.start)/1000/256)/times;
      }

  };

  Spectrogram.prototype.connectSource = function(audioBuffer, audioContext) {
    //alert("start:"+media.slice.start+";end:"+media.slice.end);
    var source = this._sources.audioBufferStream || {};
    // clear current audio process
    audioContext = (!audioContext && source.audioBuffer.context) || (!audioContext && source.audioContext) || audioContext;
    var sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    var canvas = document.getElementById(ECGClass+"_Spectrograms");
    var canvasContext = canvas.getContext('2d');
    source = {
      audioBuffer: audioBuffer,
      audioContext: audioContext,
      sourceNode: sourceNode,
      analyser: null,
      scriptNode: null,
      canvasContext: canvasContext
    };
    this._sources.audioBufferStream = source;
    var source_ = this._sources.audioBufferStream;
    source_.scriptNode = source_.audioContext.createScriptProcessor(256, 1, 1);
    source_.scriptNode.connect(source_.audioContext.destination);
    source_.scriptNode.onaudioprocess = function(event) {
      var array = new Uint8Array(source_.analyser.frequencyBinCount);
      source_.analyser.getByteFrequencyData(array);
      this._draw(array, source_.canvasContext);
    }.bind(this);
    //source_.sourceNode.onended = function() { this.pause(); }.bind(this);
    source_.analyser = source_.audioContext.createAnalyser();
    source_.analyser.smoothingTimeConstant = 0;
    source_.analyser.fftSize = 1024; // 一個 Frame (樣本群) 的大小
    source_.analyser.connect(source_.scriptNode);
    source_.sourceNode.connect(source_.analyser);
  };

  Spectrogram.prototype.start = function(offset) {
    var source = this._sources.audioBufferStream;
    source.sourceNode.start(0, offset||0);
    this._audioEnded = false;
    this._paused = false;
    this._startedAt = document.getElementById("audio_player").currentTime;
  };

  Spectrogram.prototype.pause = function() {
    var source = this._sources[Object.keys(this._sources)[0]];
    if (source && source.sourceNode) source.sourceNode.stop();
    this._audioEnded = true;
    this._paused = true;
    this._pausedAt = document.getElementById("audio_player").currentTime;
  };

  var times=1;
  Spectrogram.prototype.resume = function(offset) {
    times++;
    var source = this._sources[Object.keys(this._sources)[0]];
    this._paused = false;
    if (this._pausedAt) {
      this.connectSource(source.audioBuffer, source.audioContext);
      this.start(offset || (this._pausedAt));
    }
    console.log(times);
  };

  Spectrogram.prototype.clear = function(canvasContext) {
    var source = this._sources[Object.keys(this._sources)[0]];
    if (source && source.sourceNode) source.sourceNode.stop();
    this._audioEnded = true;
    source.scriptNode.onaudioprocess = null;
    canvasContext = canvasContext || source.canvasContext;
    var canvas = canvasContext.canvas;
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    width=1;
  };

  Spectrogram.prototype._generateDefaultColors = function(steps) {
    var frequency = Math.PI / steps;
    var amplitude = 127;
    var center = 128;
    var slice = (Math.PI / 2) * 3.1;
    var colors = [];

    function toRGBString(v) { return 'rgba(' + [v,v,v,1].toString() + ')'; }

    for (var i = 0; i < steps; i++) {
      var v = (Math.sin((frequency * i) + slice) * amplitude + center) >> 0;
      colors.push(toRGBString(v));
    }

    return colors;
  };

  Spectrogram.prototype._getColor = function(index) {
    var color = this._colors[index>>0];
    if (typeof color === 'undefined') color = this._colors[0];
    return color;
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Spectrogram;
    }
    exports.Spectrogram = Spectrogram;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() {
      return Spectrogram;
    });
  } else {
    root.Spectrogram = Spectrogram;
  }

})(this);
