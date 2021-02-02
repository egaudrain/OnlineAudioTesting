/**
 * jspsych-audio-safari-init
 * Etienne Gaudrain - 2021-02-01
 *
 * Safari is the new Internet Explorer and does everything differently from others
 * for better, and mostly for worse. Here is a plugin to display a screen for the user to click on
 * before starting the experiment to unlock the audio context, if we are dealing with Safari.
 *
 * See https://github.com/jspsych/jsPsych/issues/1445.
 *
 * NOTE: When not using the WebAudio API (jsPsych initialised with `use_webaudio=false`),
 * jspsych.js needs to be modifed to expose the list of preloaded sounds (or, it seems,
 * at least the first one). In the code below, this is done within
 * `jsPsych.pluginAPI.preloaded_audio_IDs()`.
 *
 **/

jsPsych.plugins["audio-safari-init"] = (function() {

    var plugin = {};

    //jsPsych.pluginAPI.registerPreload('audio-safari-init', 'stimulus', 'audio');

    plugin.info = {
        name: 'audio-safari-init',
        description: '',
        parameters: {
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: "Click on the screen to start the experiment",
                description: 'The prompt asking the user to click on the screen.'
            }
        }
    }

    plugin.trial = function(display_element, trial) {

        // Ideally, we would want to be able to detect this on feature basis rather than using userAgents,
        // but Safari just doesn't count clicks not directly aimed at starting sounds, while other browsers do.
        const is_Safari = /Version\/.*Safari\//.test(navigator.userAgent) && !window.MSStream;
        if(is_Safari){
            display_element.innerHTML = trial.prompt;
            document.addEventListener('touchstart', init_audio);
            document.addEventListener('click', init_audio);
        } else {
            jsPsych.finishTrial();
        }

        function init_audio(){
            var context = jsPsych.pluginAPI.audioContext();
            if(context==null){
                // This requires the hacked version of jspsych 6.1.0_eg2021-02-21
                jsPsych.pluginAPI.preloaded_audio_IDs().slice(0,1).forEach(function(a){
                    var b = jsPsych.pluginAPI.getAudioBuffer(a);
                    b.play();
                    b.pause();
                    b.currentTime = 0;
                });
            }
            end_trial();
        }

        // function to end trial when it is time
        function end_trial() {

            document.removeEventListener('touchstart', init_audio);
            document.removeEventListener('click', init_audio);

            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();

            // kill keyboard listeners
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.finishTrial();
        }


    };

    return plugin;
})();
