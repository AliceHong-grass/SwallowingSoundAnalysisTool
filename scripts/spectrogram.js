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
    this._sources = { audioBufferStream: null };
    this._baseCanvas = canvas;
    this._baseCanvas.width = _result(baseCanvasOptions.width) || this._baseCanvas.width;
    this._baseCanvas.height = _result(baseCanvasOptions.height) || this._baseCanvas.height;
  }

  var n=0;
  var width=0;
  Spectrogram.prototype.connectSource = function(audioBuffer, audioContext) {
    var source = this._sources.audioBufferStream || {};
    audioContext = (!audioContext && source.audioBuffer.context)
                || (!audioContext && source.audioContext)
                || audioContext;
    var canvas = document.getElementById(Class+"_Spectrograms");
    var canvasContext = canvas.getContext('2d');
    source = {
      audioBuffer: audioBuffer,
      audioContext: audioContext,
      scriptNode: null,
      canvasContext: canvasContext
    };
    this._sources.audioBufferStream = source;
    var source_ = this._sources.audioBufferStream;
    source_.scriptNode = source_.audioContext.createScriptProcessor(256, 1, 1);
    source_.scriptNode.connect(source_.audioContext.destination);
    source_.scriptNode.onaudioprocess = function() {
      if (!this._paused) {
        var signal = dataslice.slice(0+64*n,1024+64*n);
        if(signal.length==1024){
          fft.forward(signal);
          var canvas = source_.canvasContext.canvas;
          for (var i = 0; i < fft.spectrum.length; i++) {
            source_.canvasContext.fillStyle = "rgb(0,0,0,"+fft.spectrum[i]/100+")";
            source_.canvasContext.fillRect(width,
                                           canvas.height-i*canvas.height/fft.spectrum.length,
                                           canvas.width/(((dataslice.length-1024)/64)+1),
                                           canvas.height/fft.spectrum.length);
          }
          width+=canvas.width/(((dataslice.length-1024)/64)+1);
          n++;
        }
      }
    }.bind(this);
  };

  Spectrogram.prototype.start = function() {
    this._audioEnded = false;
    this._paused = false;
    this._startedAt = document.getElementById("audio_player").currentTime;
  };

  Spectrogram.prototype.pause = function() {
    this._audioEnded = true;
    this._paused = true;
    this._pausedAt = document.getElementById("audio_player").currentTime;
  };

  Spectrogram.prototype.resume = function(offset) {
    var source = this._sources[Object.keys(this._sources)[0]];
    this._paused = false;
    if (this._pausedAt) {
      this.connectSource(source.audioBuffer, source.audioContext);
      this.start(offset || (this._pausedAt));
    }
  };

  Spectrogram.prototype.clear = function(canvasContext) {
    var source = this._sources[Object.keys(this._sources)[0]];
    this._audioEnded = true;
    source.scriptNode.onaudioprocess = null;
    canvasContext = canvasContext || source.canvasContext;
    var canvas = canvasContext.canvas;
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    width=1;
    n=0;
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
