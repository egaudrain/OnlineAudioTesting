/**
 * jspsych-audio-sequence-button-response for jsPsych v6.3
 * Etienne Gaudrain <etienne.gaudrain@cnrs.fr> 2021-10-15
 *
 * Plugin for playing a sequence of audio files and getting an HTML button response
 *
 * Based on jspsych-audio-button-response.
 *
 * 2022-03-19: Fixed bug that ISI was applied also to last item.
 **/

jsPsych.plugins["audio-sequence-button-response"] = (function() {
    var plugin = {};

    jsPsych.pluginAPI.registerPreload('audio-sequence-button-response', 'stimuli', 'audio');

    plugin.info = {
        name: 'audio-sequence-button-response',
        description: '',
        parameters: {
            stimuli: {
                type: jsPsych.plugins.parameterType.AUDIO,
                pretty_name: 'Stimuli',
                default: undefined,
                array: true,
                description: 'The audio files to be played.'
            },
            choices: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Choices',
                default: undefined,
                array: true,
                description: 'The button labels.'
            },
            button_html: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                pretty_name: 'Button HTML',
                default: '<button class="jspsych-btn">%choice%</button>',
                array: true,
                description: 'Custom button. Can make your own style.'
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Any content here will be displayed below (or above) the buttons.'
            },
            prompt_position: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt position',
                default: 'bottom',
                description: 'Determines whether the prompt is printed above or below the buttons: "top" or "bottom".'
            },
            isi: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Inter-stimulus-interval',
                default: 0,
                description: 'The delay in between stimulus presentation (in ms).'
            },
            trial_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Trial duration',
                default: null,
                description: 'The maximum duration to wait for a response.'
            },
            margin_vertical: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Margin vertical',
                default: '0px',
                description: 'Vertical margin of button.'
            },
            margin_horizontal: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Margin horizontal',
                default: '8px',
                description: 'Horizontal margin of button.'
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
                description: 'If true, then the trial will end as soon as all audio files are finished playing.'
            },
            visual_feedback: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Visual feedback',
                default: false,
                description: 'If true, then visual feedback will be provided after the trial ends.'
            },
            i_correct: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Index of the correct button',
                default: null,
                description: 'This can be an integer or a function. Only necessary if visual feedback is true.'
            },
        }
    }

    plugin.trial = function(display_element, trial) {

        var context = jsPsych.pluginAPI.audioContext();
        var audio;

        if(trial.visual_feedback===true && trial.i_correct===null)
            throw "'i_correct' has to be defined if visual feedback is requested.";

        //display buttons
        var buttons = [];

        function play_next_audio() {
            //var i = load_next_audio();

            if(typeof play_next_audio.i === 'undefined')
            {
                // This is the first pass, we disable the buttons
                $(display_element).find(".jspsych-audio-sequence-button-response button").addClass("disabled").prop('disabled', true);
                play_next_audio.i = 0;
            }

            // Is it the last stimulus, do we need to end trial?
            if(play_next_audio.i >= trial.stimuli.length) {
                $(display_element).find(".jspsych-audio-sequence-button-response button").removeClass("disabled").prop('disabled', false);
                if(trial.trial_ends_after_audio) {
                    end_trial();
                }
                return false;
            }

            // Prepare the next sound to play
            jsPsych.pluginAPI.getAudioBuffer(trial.stimuli[play_next_audio.i]).then(function(buffer){
                if(context !== null) {
                    audio = context.createBufferSource();
                    audio.buffer = buffer;
                    audio.connect(context.destination);
                } else {
                    audio = buffer;
                    audio.currentTime = 0;
                }
                audio.addEventListener('ended', function _audio_ended(){
                    $(display_element).find('.jspsych-audio-sequence-button-response button.highlighted').removeClass('highlighted');
                    if(play_next_audio.i<trial.stimuli.length){
                        setTimeout(play_next_audio, trial.isi);
                    } else {
                        setTimeout(play_next_audio, 0);
                    }
                    audio.removeEventListener('ended', _audio_ended);
                });

                // Highlight the current button
                $(display_element).find('#jspsych-audio-sequence-button-response-' + play_next_audio.i +' button').addClass('highlighted');

                if(context !== null) {
                    startTime = context.currentTime;
                    audio.start(startTime);
                } else {
                    audio.play();
                }

                play_next_audio.i++;
            });
        }

        //display buttons
        if(Array.isArray(trial.button_html)) {
            if(trial.button_html.length == trial.choices.length) {
                buttons = trial.button_html;
            } else {
                console.error('Error in ' + plugin.info.name + '. The length of the button_html array does not equal the length of the choices array');
            }
        } else {
            for(var i = 0; i < trial.choices.length; i++) {
                buttons.push(trial.button_html);
            }
        }

        var html = '';

        //show prompt if there is one
        if(trial.prompt_position == 'top' && trial.prompt !== null) {
            html += "<p class='jspsych-prompt'>"+trial.prompt+"</p>";
        }

        html += '<div id="jspsych-audio-button-response-btngroup">';
        for(var i = 0; i < trial.choices.length; i++) {
            var str = buttons[i].replace(/%choice%/g, trial.choices[i]);
            html += '<div class="jspsych-audio-sequence-button-response" style="cursor: pointer; display: inline-block; margin:' + trial.margin_vertical + ' ' + trial.margin_horizontal + '" id="jspsych-audio-sequence-button-response-' + i + '" data-choice="' + i + '">' + str + '</div>';
        }
        html += '</div>';

        //show prompt if there is one
        if(trial.prompt_position != 'top' && trial.prompt !== null) {
            html += "<p class='jspsych-prompt'>"+trial.prompt+"</p>";
        }

        $(display_element).html( html );

        for(var i = 0; i < trial.choices.length; i++) {
            $(display_element).find('#jspsych-audio-sequence-button-response-' + i).click( function(e) {
                var choice = e.currentTarget.getAttribute('data-choice'); // don't use dataset for jsdom compatibility
                after_response(choice);
            });
        }

        // store response
        var response = {
            rt: null,
            button: null
        };

        // A custom blink function for feedback in case semantic's transition isn't there
        function blink(elm, n, cssClass, after_cb) {
            if(n<=0) {
                after_cb();
            } else {
                $(elm).toggleClass(cssClass);
                setTimeout(function(){ blink(elm, n-1, cssClass, after_cb); }, 200);
            }
        }

        // function to handle responses by the subject
        function after_response(choice) {

            // measure rt
            var end_time = performance.now();
            var rt = end_time - start_time;
            response.button = choice;
            response.rt = rt;

            // disable all the buttons after a response
            $('.jspsych-audio-sequence-button-response button').addClass('disabled').prop('disabled', true);

            if(trial.visual_feedback) {
                var cssClass, n, animation;
                var correct_button = $('#jspsych-audio-sequence-button-response-'+trial.i_correct+' button');
                var correct = parseInt(trial.i_correct) == parseInt(response.button);
                correct_button.removeClass('disabled').prop('disabled', false).css('pointer-events', 'none');
                correct_button.addClass('visual-feedback');

                if(correct)
                {
                    cssClass = 'correct';
                    animation = 'bounce'; //'jiggle';
                    n = 2;
                }
                else
                {
                    cssClass = 'incorrect';
                    animation = 'shake'; //'tada';
                    n = 6;
                }
                correct_button.addClass(cssClass);

                if($.prototype.transition)
                {
                    // We have semantic's transitions installed
                    correct_button.transition({
                        animation: animation,
                        onComplete: function() {
                            correct_button.css('pointer-events', '').addClass('disabled').prop('disabled', true);
                            end_trial();
                        },
                        verbose: true
                    });
                } else {
                    blink(correct_button, n, cssClass, end_trial);
                }
            } else {
                if(trial.response_ends_trial) {
                    end_trial();
                }
            }
        };

        // function to end trial when it is time
        function end_trial() {

            // stop the audio file if it is playing
            // remove end event listeners if they exist
            if(context !== null) {
                audio.stop();
            } else {
                audio.pause();
            }
            audio.removeEventListener('ended', end_trial);

            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();

            // gather the data to store for the trial
            var trial_data = {
                "rt": response.rt,
                "stimuli": trial.stimuli,
                "button_pressed": response.button
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            $(display_element).ready(function(){
                jsPsych.finishTrial(trial_data);
            });
        };

        // start time
        var start_time = performance.now();

        $(display_element).ready(play_next_audio);

        // end trial if time limit is set
        if(trial.trial_duration !== null) {
            jsPsych.pluginAPI.setTimeout(function() {
                end_trial();
            }, trial.trial_duration);
        }

    };

    return plugin;
})();
