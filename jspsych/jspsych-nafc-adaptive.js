/*------------------------------------------------------------------------------
 * n-AFC Adaptive Task generic for jsPsych
 *------------------------------------------------------------------------------
 * This template requires the jspsych-audio-sequence-button-response plugin.
 *------------------------------------------------------------------------------
 * Author: Etienne Gaudrain <etienne.gaudrain@cnrs.fr>
 *----------------------------------------------------------------------------*/

/* To use, you need to include the following in your webpage:
<script src="/js/vendor/jspsych.js"></script>
<script src="/js/vendor/jspsych-plugins/jspsych-instructions.js"></script>
<script src="/js/vendor/jspsych-plugins/jspsych-waitfor-function.js"></script>
<script src="/js/vendor/jspsych-plugins/jspsych-audio-sequence-button-response.js"></script>
*/

/* Here's an example for next_trial:
function prepare_trial(last_trial, step, options, condition, done){
    var diff = last_trial.trial_definition.f0 + step;
    var new_trial = {
        stimuli: null,
        i_correct: getRandomIntInclusive(0,3),
        trial_definition: {f0: diff+"st"}, // The parameters that define the trial
        step: step, // Just in case we modified the provided step
        difference: diff
    };
    async_generate_stimuli(function(){
        new_trial.stimuli = ['blah', 'blah', 'blih'];
        done(new_trial);
    });
}

function send_data_securely_to_server(data){
    console.log(data.last().values().json());
}
*/

/* Here's an example for options:
var options = {
    initial_step_size: 2,
    starting_difference: 12,
    step_size_modifier: 1/Math.sqrt(2),
    down_up: [2, 1], // 2-down, 1-up => 70.7%
    terminate_on_nturns: 8,
    terminate_on_ntrials: 150,
    terminate_on_max_difference: 25,
    threshold_on_last_nturns: 6,
    change_step_size_on_difference: 2,
    change_step_size_on_ntrials: 15,
    prompt: "Which of the three is different from the two others?",
    isi: 250,
    intervals: ['1', '2', '3'],
    prepare_trial: prepare_trial,
    after_the_run: send_data_securely_to_server, // function(options, condition, data, success_cb())
    start_button: 'Beginnen',
    opening_message: "<h1>Test</h1><p>You will hear three sounds. Choose the one that is different from the two others.</p>",
    closing_message: "<h1>Thank you!</h1><p>This is the end of this block. Thank you for your help!</p>"
};
*/

// This relies on some tools and polyfills that are in /js/tools.js

function nAFC_adapt(opts, condition) {
    // This generates trials for one "condition", that is a whole run that leads
    // to a threshold.
    //
    // `options` defines the parameters of the AFC
    // `condition` defines the condition along which the parameters are being adapted.

    var options = jsPsych.utils.deepCopy(opts);

    // Mandatory arguments in options
    var mand_opts = ['initial_step_size', 'starting_difference', 'down_up', 'terminate_on_nturns',
        'terminate_on_ntrials', 'terminate_on_max_difference', 'threshold_on_last_nturns', 'step_size_modifier', 'change_step_size_on_difference',
        'change_step_size_on_ntrials', 'intervals', 'prepare_trial'
    ];
    for(var k of mand_opts) {
        if(!(k in options)) {
            throw "nAFC_adapt: " + k + " is a mandatory option to provide.";
            return null;
        }
    }

    if(typeof options.opening_message === 'undefined')
        options.opening_message = null;
    if(typeof options.closing_message === 'undefined')
        options.closing_message = null;
    if(typeof options.prompt === 'undefined')
        options.prompt = null;
    if(typeof options.isi === 'undefined')
        options.isi = 0;
    if(typeof options.after_the_run === 'undefined')
        options.after_the_run = function(dat, done){ done(); };

    options.current_step = 0;
    options.current_step_size = options.initial_step_size;
    options.current_difference = options.starting_difference;
    options.change_step_size_on_ntrials_counter = 0;

    function is_correct(t) {
        return parseInt(t.button_pressed) == t.i_correct;
    }

    function whereto_next(last_trials) {
        // This returns the new step based on the last n trials.

        if(typeof whereto_next.v === 'undefined')
            whereto_next.v = [];

        whereto_next.v.push(last_trials.slice(-1)[0].correct);

        // We go neither up nor down
        var step = 0;

        console.log("---------------------- WHERE TO NEXT?");
        console.log(whereto_next.v);

        options.change_step_size_on_ntrials_counter++;

        // Are we going down?
        //if(typeof last_trials[last_trials.length - options.down_up[0]] !== 'undefined') {
        if(whereto_next.v.length >= options.down_up[0] && whereto_next.v.slice(-options.down_up[0]).every(Boolean)) {
            // We're goin' down!
            if(options.current_difference - options.current_step_size <= 0)
                options.current_step_size = options.current_difference / 2;
            else if(options.current_difference <= options.current_step_size * options.change_step_size_on_difference ||
                options.change_step_size_on_ntrials_counter == options.change_step_size_on_ntrials) {
                options.current_step_size = options.current_step_size * options.step_size_modifier;
                options.change_step_size_on_ntrials_counter = 0
            }

            step = -options.current_step_size;

            console.log("WE'RE GOIN' DOWN!");

            whereto_next.v = [];
        }

        // Are we going up?
        //if(typeof last_trials[last_trials.length - options.down_up[1]] !== 'undefined') {
        else if(whereto_next.v.length >= options.down_up[1] && whereto_next.v.slice(-options.down_up[1]).every(function(t) { return !t; })) {
            // We're goin' up!
            if(options.current_difference <= options.current_step_size * options.change_step_size_on_difference ||
                options.change_step_size_on_ntrials_counter == options.change_step_size_on_ntrials) {
                options.current_step_size = options.current_step_size * options.step_size_modifier;
                options.change_step_size_on_ntrials_counter = 0
            }

            step = options.current_step_size;

            console.log("WE'RE GOIN' UP!");

            whereto_next.v = [];
        }

        else {
            console.log("WE'RE GOIN' NOWHERE!");
        }

        if(options.change_step_size_on_ntrials_counter == options.change_step_size_on_ntrials)
            options.change_step_size_on_ntrials_counter = 0;

        return step;
    }

    function do_we_keep_going(data) {
        // Data is a jsPsych DataCollection that contains all the audio-sequence-button-response trials so far
        // returns true to continue, and false to stop
        // When we stop we insert a new row in the data collection containing the threshold or the reason why we stopped

        var steps = data.select('step').values;
        steps.push(options.current_step);
        var differences = data.select('difference').values;
        // The current difference hasn't been computed yet, this happens prepare_trial(), so we add the likely next value
        differences.push(options.current_difference + options.current_step);

        if(data.count() >= options.terminate_on_ntrials) {

            jsPsych.setProgressBar(1);
            var corrects = data.select('correct').values;
            jsPsych.data.get().push({
                type: 'threshold',
                threshold: NaN,
                geom_threshold: NaN,
                reason: 'ntrials',
                steps: steps,
                differences: differences,
                condition: condition,
                corrects: corrects,
                internal_node_id: data.last().select('internal_node_id').values[0]
            });
            return false;

        } else if(differences.slice(-1)[0]>options.terminate_on_max_difference) {

            jsPsych.setProgressBar(1);
            var corrects = data.select('correct').values;
            jsPsych.data.get().push({
                type: 'threshold',
                threshold: NaN,
                geom_threshold: NaN,
                reason: 'max_difference',
                steps: steps,
                differences: differences,
                condition: condition,
                corrects: corrects,
                internal_node_id: data.last().select('internal_node_id').values[0]
            });
            return false;

        } else {

            var snnsd = steps.non_zero().map(Math.sign).diff().non_zero();
            nturns = snnsd.length;

            console.log("---------------------- DO WE KEEP GOIN'?");
            console.log("Corrects: ["+data.select('correct').values+"]");
            console.log("steps: ["+steps+"]");
            console.log("steps!=0:             ["+steps.non_zero()+"]");
            console.log("sign(steps!=0):       ["+steps.non_zero().map(Math.sign)+"]");
            console.log("diff(sign(steps!=0)): ["+steps.non_zero().map(Math.sign).diff()+"]");
            console.log("snnsd:                ["+snnsd+"]");
            console.log("nturns:"+nturns);

            jsPsych.setProgressBar(nturns/options.terminate_on_nturns);

            if(nturns >= options.terminate_on_nturns) {
                // That's a nice way of ending... Let's calculate the threshold

                var i_nz = steps.findIndices(function(x) { return x != 0; });
                var i_tp = i_nz.filter(function(x, i) { return snnsd[i] != 0; });
                i_tp.push(differences.length - 1);
                i_tp = i_tp.slice(-options.threshold_on_last_nturns);

                var corrects = data.select('correct').values;

                thr      = differences.select(i_tp).mean();
                geom_thr = Math.exp(differences.select(i_tp).map(Math.log).mean());

                jsPsych.data.get().push({
                    type: 'threshold',
                    threshold: thr,
                    geom_threshold: geom_thr,
                    reason: 'nturns',
                    steps: steps,
                    differences: differences,
                    condition: condition,
                    corrects: corrects,
                    internal_node_id: data.last().select('internal_node_id').values[0]
                });

                return false;
            }
        }

        return true;
    }

    // Make an adaptive run based on a condition

    var run_timeline = [];

    if(options.opening_message != null) {
        run_timeline.push({
            type: 'instructions',
            pages: [
                options.opening_message
            ],
            show_clickable_nav: true,
            button_label_next: options.start_button,
            allow_backward: false,
            on_start: function(){
                jsPsych.setProgressBar(0);
            }
        });
    }

    //var ExpState = { N: 0 };

    var t = {
        timeline: [{
                type: 'waitfor-function',
                func: function(done) {
                    //var files = ['/audio/Beer.wav', '/audio/Beer.wav', '/audio/Beer.wav'];
                    //ExpState.files = files;

                    var last_trial = jsPsych.data.get().filter({trial_type: 'audio-sequence-button-response'}).last().values()[0];

                    // prepare_trial is a user provided function that expects the following arguments:
                    //   last_trial: the last trial
                    //   step: the new step that needs applying
                    //   options: all the options
                    //   condition: a definition of the condition we're in
                    //   success_callback: the function that will be called upon success, which takes the new trial definition
                    // new_trial has the following keys:
                    //   stimuli: the list of sound files to load
                    //   i_correct: the index of the correct response
                    //   trial_definition: the parameters that define the trial
                    //   step: the step used to create the new trial
                    //   difference: the difference used to create the new trial

                    options.prepare_trial(
                        last_trial, options.current_step, options, condition,
                        function(new_trial) {
                            options.current_difference = new_trial.difference;
                            jsPsych.pluginAPI.preloadAudioFiles(new_trial.stimuli, function() {
                                done(new_trial);
                            });
                        }
                    );
                },
                async: true,
                min_duration: 1000
            },
            {
                type: 'audio-sequence-button-response',
                stimuli: function() {
                    return jsPsych.data.getLastTrialData().values()[0].value.stimuli;
                },
                data: function() {
                    return jsPsych.data.getLastTrialData().values()[0].value;
                },
                trial_ends_after_audio: false,
                i_correct: function() {
                    return jsPsych.data.getLastTrialData().values()[0].value.i_correct;
                },
                visual_feedback: options.visual_feedback,
                button_html: "<button class='jspsych-btn afc-btn'>%choice%</button>",
                choices: options.intervals,
                prompt: options.prompt,
                prompt_position: 'top',
                isi: options.isi,
                on_finish: function(data) {
                    data.correct = is_correct(data);
                    console.log("Correct? "+data.correct);
                }
            }
        ],
        loop_function: function(data) {
            // If only we had access to the current nodeID, things would be a bit simpler... but we'll hack something

            var last_trial_node_id = jsPsych.data.getLastTrialData().select('internal_node_id').values[0];
            var the_node_id_we_want = last_trial_node_id.split('-').slice(0,-2).join("-");

            options.current_step = whereto_next(jsPsych.data.get().filter({trial_type: 'audio-sequence-button-response'}).last(Math.max(options.down_up[0], options.down_up[1]) + 1).values());

            return do_we_keep_going(jsPsych.data.getDataByTimelineNode(the_node_id_we_want).filter({ trial_type: 'audio-sequence-button-response' }));
        },
    };

    run_timeline.push(t);

    // To save the data... would be better suited for on_finish, but we need async
    run_timeline.push({
        type: 'waitfor-function',
        func: function(done) {
            var last_trial_node_id = jsPsych.data.getLastTrialData().select('internal_node_id').values[0];
            var the_node_id_we_want = last_trial_node_id.split('-').slice(0,-2).join("-");

            options.after_the_run(options, condition, jsPsych.data.getDataByTimelineNode(the_node_id_we_want), done);
        },
        async: true,
        min_duration: 0
    });

    if(options.closing_message != null) {
        run_timeline.push({
            type: 'instructions',
            pages: [
                options.closing_message
            ],
            show_clickable_nav: true,
            button_label_next: 'OK',
            allow_backward: false
        });
    }
    /*
    run_timeline.push({
        type: 'instructions',
        pages: [
            "<h1>Thank you!</h1>" +
            "<p>This is the end of that block.</p>"
        ],
        show_clickable_nav: true,
        button_label_next: 'Next'
    });
    */

    return {timeline: run_timeline};

}
