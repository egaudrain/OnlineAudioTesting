/**
 * jspsych-waitfor-function
 * Plugin for waiting for the execution of an arbitrary function during a jspsych experiment.
 * It's the same as call-function except that a loading wheel is displayed.
 *
 * The loading wheel requires jQuery and Semantic.
 *
 * Etienne Gaudrain <etienne.gaudrain@cnrs.fr>
 *
 **/

jsPsych.plugins['waitfor-function'] = (function() {

    var plugin = {};

    plugin.info = {
        name: 'waitfor-function',
        description: '',
        parameters: {
            func: {
                type: jsPsych.plugins.parameterType.FUNCTION,
                pretty_name: 'Function',
                default: undefined,
                description: 'Function to call'
            },
            async: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Asynchronous',
                default: false,
                description: 'Is the function call asynchronous?'
            },
            min_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Minimum duration',
                default: 0,
                description: 'The wait will last at least this time (in  ms).'
            }
        }
    }

    plugin.trial = function(display_element, trial) {

        var start_time = performance.now();

        trial.post_trial_gap = 0;
        var return_val;

        $(display_element).html("<div class='ui active loader'></div>");

        if(trial.async) {
            var done = function(data) {
                return_val = data;
                end_trial();
            }
            trial.func(done);
        } else {
            return_val = trial.func();
            end_trial();
        }

        function end_trial() {
            $(display_element).empty();

            var end_time = performance.now();
            console.log("We finished in "+(end_time-start_time)+" ms...");
            if(end_time-start_time < trial.min_duration)
            {
                trial.post_trial_gap = trial.min_duration - (end_time-start_time);
                console.log("We need to wait "+trial.post_trial_gap+" ms.");
            }

            var trial_data = {
                value: return_val
            };

            jsPsych.finishTrial(trial_data);
        }
    };

    return plugin;
})();
