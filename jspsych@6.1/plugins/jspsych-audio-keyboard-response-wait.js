/**
 * jspsych-audio-keyboard-response-wait
 * Josh de Leeuw, Etienne Gaudrain
 *
 * plugin for playing an audio file and getting a keyboard response.
 *
 * Based on jspsych-audio-keyboard-response but offers the possibility to wait for
 * the audio to finish before moving to next trial.
 *
 **/

jsPsych.plugins["audio-keyboard-response-wait"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('audio-keyboard-response-wait', 'stimulus', 'audio');

  plugin.info = {
    name: 'audio-keyboard-response-wait',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.AUDIO,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The audio to be played.'
      },
      choices: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: 'Choices',
        array: true,
        default: jsPsych.ALL_KEYS,
        description: 'The keys the subject is allowed to press to respond to the stimulus.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'This string can contain HTML markup. The intention is that it can be used to provide a reminder about the action the subject is supposed to take.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'The maximum duration to wait for a response.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, the trial will end when user makes a response.'
      },
      trial_ends_after_audio: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Trial ends after audio',
        default: false,
        description: 'If true, then the trial will end as soon as the audio file finishes playing.'
      },
      wait_for_audio: {
          type: jsPsych.plugins.parameterType.BOOL,
          pretty_name: 'Wait for audio to finish',
          default: false,
          description: 'If `response_ends_trial` is true, this will still wait for the audio to end before ending the trial.'
      },
      dim_content_after_response: {
          type: jsPsych.plugins.parameterType.BOOL,
          pretty_name: 'Dim content after response',
          default: false,
          description: 'Will dim the content once the response has been given.'
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    // setup stimulus
    var context = jsPsych.pluginAPI.audioContext();
    if(context !== null){
      var source = context.createBufferSource();
      source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
      source.connect(context.destination);
    } else {
      var audio = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
      audio.currentTime = 0;
    }

    // set up end event if trial needs it

    var audio_is_finished = false;
    var mark_audio_as_finished = function(){ audio_is_finished = true; };

    if(trial.trial_ends_after_audio){
      if(context !== null){
        source.onended = function() {
          end_trial();
        }
      } else {
        audio.addEventListener('ended', end_trial);
      }
    } else {
      if(context !== null){
        source.onended = function() {
          mark_audio_as_finished();
        }
      } else {
        audio.addEventListener('ended', mark_audio_as_finished);
      }
    }

    // show prompt if there is one
    if (trial.prompt !== null) {
      display_element.innerHTML = trial.prompt;
    }

    // store response
    var response = {
      rt: null,
      key: null
    };

    // function to end trial when it is time
    function end_trial() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // stop the audio file if it is playing
      // remove end event listeners if they exist
      if(context !== null){
        source.stop();
        source.onended = function() { }
      } else {
        audio.pause();
        audio.removeEventListener('ended', end_trial);
      }

      // kill keyboard listeners
      jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // gather the data to store for the trial
      if(context !== null && response.rt !== null){
        response.rt = Math.round(response.rt * 1000);
      }
      var trial_data = {
        "rt": response.rt,
        "stimulus": trial.stimulus,
        "key_press": response.key
      };

      // clear the display
      display_element.innerHTML = '';
      display_element.style.removeProperty("opacity");

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = function(info) {

      // only record the first response
      if (response.key == null) {
        response = info;
      }

      if (trial.dim_content_after_response) {
        display_element.style.opacity = "50%";
      }

      if (trial.response_ends_trial) {
        if (trial.wait_for_audio && !audio_is_finished) {
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            if(context !== null){
              source.onended = function() {
                end_trial();
              }
            } else {
              audio.addEventListener('ended', end_trial);
            }
            // Just in case the audio finished in the meantime
            if(audio_is_finished) {
                end_trial();
            }
        } else {
            end_trial();
        }
      }
    };

    // start audio
    if(context !== null){
      startTime = context.currentTime;
      source.start(startTime);
    } else {
      audio.play();
    }

    // start the response listener
    if(context !== null) {
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: 'audio',
        persist: false,
        allow_held_key: false,
        audio_context: context,
        audio_context_start_time: startTime
      });
    } else {
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: 'performance',
        persist: false,
        allow_held_key: false
      });
    }

    // end trial if time limit is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    }

  };

  return plugin;
})();
