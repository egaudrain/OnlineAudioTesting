/**
 * jspsych-audio-keyboard-response-clickable
 * Etienne Gaudrain
 *
 * Based on:
 * jspsych-audio-keyboard-response @6.2.0
 * Josh de Leeuw
 *
 * plugin for playing an audio file and getting a keyboard response or click on
 * a page element
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["audio-keyboard-response-clickable"] = (function() {

    var plugin = {};

    jsPsych.pluginAPI.registerPreload('audio-keyboard-response-clickable', 'stimulus', 'audio');

    plugin.info = {
        name: 'audio-keyboard-response-clickable',
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
                description: 'Any content here will be displayed below the stimulus.'
            },
            clickable: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Clickable',
                description: 'Clicking clickable elements ends trial.',
                default: true
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
            response_allowed_while_playing: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Response allowed while playing',
                default: true,
                description: 'If true, then responses are allowed while the audio is playing. ' +
                    'If false, then the audio must finish playing before a response is accepted.'
            }
        }
    }

    plugin.trial = function(display_element, trial) {

        var startTime;

        // setup stimulus
        var context = jsPsych.pluginAPI.audioContext();
        if(context !== null) {
            var source = context.createBufferSource();
            source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
            source.connect(context.destination);
        } else {
            var audio = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
            audio.currentTime = 0;
        }

        // set up end event if trial needs it
        if(trial.trial_ends_after_audio) {
            if(context !== null) {
                source.addEventListener('ended', end_trial);
            } else {
                audio.addEventListener('ended', end_trial);
            }
        }

        // show prompt if there is one
        if(trial.prompt !== null) {
            display_element.innerHTML = trial.prompt;

            if(trial.clickable){
                display_element.querySelectorAll(".clickable").forEach(function(e){
                    var clickHandler = function(event){
                        event.preventDefault();
                        var info = {'key': 'clicked', 'rt': performance.now()-startTime};
                        after_response(info);
                        e.removeEventListener('click', clickHandler);
                    };
                    e.addEventListener('click', clickHandler);
                });
            }
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
            if(context !== null) {
                source.stop();
                source.removeEventListener('ended', end_trial);
                source.removeEventListener('ended', setup_keyboard_listener);
            } else {
                audio.pause();
                audio.removeEventListener('ended', end_trial);
                audio.removeEventListener('ended', setup_keyboard_listener);
            }

            // kill keyboard listeners
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            // gather the data to store for the trial
            if(context !== null && response.rt !== null) {
                response.rt = Math.round(response.rt * 1000);
            }
            var trial_data = {
                "rt": response.rt,
                "stimulus": trial.stimulus,
                "key_press": response.key
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.finishTrial(trial_data);
        }

        // function to handle responses by the subject
        var after_response = function(info) {

            // only record the first response
            if(response.key == null) {
                response = info;
            }

            if(trial.response_ends_trial) {
                end_trial();
            }
        };

        function setup_keyboard_listener() {
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
        }

        // start audio
        if(context !== null) {
            startTime = context.currentTime;
            source.start(startTime);
        } else {
            audio.play();
        }

        // start keyboard listener when trial starts or sound ends
        if(trial.response_allowed_while_playing) {
            setup_keyboard_listener();
        } else if(!trial.trial_ends_after_audio) {
            if(context !== null) {
                source.addEventListener('ended', setup_keyboard_listener);
            } else {
                audio.addEventListener('ended', setup_keyboard_listener);
            }
        }

        // end trial if time limit is set
        if(trial.trial_duration !== null) {
            jsPsych.pluginAPI.setTimeout(function() {
                end_trial();
            }, trial.trial_duration);
        }

    };

    return plugin;
})();
