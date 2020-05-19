# jspsych-nafc-adaptive

This is not a jsPsych plugin, but instead a module that generates a timeline for adaptive
tracking of a threshold using an odd-one-out task (nAFC).

An adaptive method is a method where each new set of stimuli in a trial is based on the
previous response(s). [Levitt (1971)](https://doi.org/10.1121/1.1912375) has described these
methods for auditory stimuli. In the case of a discrimination task, the difference between
a reference and test stimuli decreases progressively to reach a certain point of the psychometric
function. Rules to go up and down, i.e. increase or decrease the physical distance between
the reference and test are described in number of 'up' and 'down'. For instance, "2-down, 1-up"
means that the difference is decreased by a given step when two consecutive correct answers are given,
while the difference is increased as soon as one mistake is made. This yields a threshold corresponding
to 70.7%-correct. Adaptive procedures are meant to be a faster alternative to a *constant-stimuli* method.

The threshold is defined as the average difference over a number of "turn-points" or "reversals". A
turn-point occurs when a the difference was increasing and start decreasing, or vice-versa.

The procedure also stops after a number of turn-points.

Some adaptive procedures use a fixed step size. These generally end-up being almost as long as constant-stimuli
approaches. To benefit from the adaptiveness of the method, it is better to use an initial step that is
large, and then refine it when we get close to threshold. The method proposed here packs mechanisms
to do so.

## Usage

To use it you'll need the following jsPsych dependencies included in your webpage:

```html
<script src="/js/vendor/jspsych.js"></script>
<script src="/js/vendor/jspsych-plugins/jspsych-instructions.js"></script>
<script src="/js/vendor/jspsych-plugins/jspsych-call-function.js"></script>
<script src="/js/vendor/jspsych-plugins/jspsych-audio-sequence-button-response.js"></script>
```

The latter is not an official jsPsych plugin, but can be found [here](../plugins/jspsych-audio-sequence-button-response.js).

The module defines a single function called `nAFC_adapt` that generates a timeline. It is then used like
this in a `<script>` markup:

```javascript
var options = ...;
var condition = "...";
var main_timeline = main_timeline.push( nAFC_adapt(options, condition) );
jsPsych.init({
    timeline: main_timeline,
    display_element: 'jspsych-target',
    show_progress_bar: true,
    auto_update_progress_bar: false,
});
```
The values of `options` and `condition` are described below.

## Options

Options is an object that contains all the parameters of the adaptive method.

Parameter                      | Type             | Description
-------------------------------|------------------|-----------------------------
initial_step_size              | numeric          | The step-size at the beginning. Make it big to go down fast, but no so big that the learning curve is too steep for the subject.
starting_difference            | numeric          | The initial difference. Make it big too, so the first trials are dead obvious, but no so big that it'll take forever to get it to converge.
step_size_modifier             | numeric          | When we update the step-size, by how much do we do so? The modifier is multiplied to the previous step.
down_up                        | array of ints    | An array of length 2. The first number is the number of correct responses needed to go down. The second number is the number of incorrect responses needed to go up.
terminate_on_nturns            | int              | We consider the procedure will have converged after this number of turn-points.
terminate_on_ntrials           | int              | This is a safety measure so that the procedure doesn't go on forever if the participant hears nothing... The procedure will stop, no matter what, after this many trials.
terminate_on_max_difference    | numeric          | Similar, but will stop the procedure when the we reach a difference larger or equal to this.
threshold_on_last_nturns       | int              | The number of turn-points used for the calculation of the threshold. This has to be smaller than `terminate_on_nturns`, and it is recommended to keep it even.
change_step_size_on_difference | numeric          | Is used to determine when the step-size should be updated. When the current difference ≤ current step-size * `change_step_size_on_difference`, the step-size will be updated.
change_step_size_on_ntrials    | int              | We also change the step size every `change_step_size_on_ntrials`.
prompt                         | string           | The prompt that is displayed above the buttons (e.g. "Click on the sound that is different from the others"). If `null` or unspecified, no prompt will be shown.
isi                            | int              | The inter-stimulus-interval in milliseconds.
intervals                      | array of strings | An array of strings specifying the labels of the buttons shown on the screen.
prepare_trial                  | function         | A callback function to prepare the stimuli for the next trial.
after_the_run                  | function         | A callback function executed once the run is finished.
start_button                   | string           | The label of the start button after the instructions.
opening_message                | HTML string      | The instructions before the first trial is presented. If `null` or omitted, this is skipped.
closing_message                | HTML string      | The closing message after the run is finished. If `null` or omitted, this is skipped.
visual_feedback                | boolean          | Wether visual feedback is used.

The callback functions are detailed below.

Here's an example:

```javascript
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
    isi: 500,
    intervals: ['1', '2', '3'],
    prepare_trial: prepare_trial, // function(last_trial, step, options, condition, done_cb())
    after_the_run: send_data_securely_to_server, // function(options, condition, data, success_cb())
    start_button: 'Beginnen',
    opening_message: "<h1>Test</h1><p>You will hear three sounds. Choose the one that is different from the two others.</p>",
    closing_message: "<h1>Thank you!</h1><p>This is the end of this block. Thank you for your help!</p>"
    visual_feedback: true,
    /* ------- You can also add yur custom options ------- */
    sound_folder: 'CV/nl_nl',
    sound_format: 'wav',
    syllables: ["su", "si+", "po", "l@", "sa"],
    ref_f0: 242
};
```

### `prepare_trial()`

This callback is called before the trial is presented. It has the following signature:

```javascript
function prepare_trial(last_trial, step, options, condition, done_cb) {
    ...
}
```

It receives the following arguments:

*   `last_trial`: This is the data from the last 'audio-sequence-button-response' trial. It corresponds to:
    `var last_trial = jsPsych.data.get().filter({trial_type: 'audio-sequence-button-response'}).last().values()[0];`.

    It contains the following fields:
    ```javascript
    {
        button_pressed: "2"
        correct: false
        difference: 12
        i_correct: 1
        internal_node_id: "0.0-0.0-1.0-1.0"
        rt: 17810.014999995474
        step: 0
        stimuli: ["snd/a.mp3", "snd/b.mp3", "snd/c.mp3"]
        time_elapsed: 22901
        trial_definition: {df0: "12st", syllables: Array(3)}
        trial_index: 2
        trial_type: "audio-sequence-button-response"
    }
    ```

    You can use these to construct the next trial.

*   `step`: This is the current, computed value for the trial we're preparing. That is, step size modifications have been applied and the sign determines whether we're going up or down.
    You can compute the new value of the difference with: `var diff = options.current_difference + step;`. The reason we don't pass on the difference is because there may be reasons to alter the
    step-size in the trial preparation process, or the difference may be quantised if we're dealing with a set of pre-computed stimuli. In other words, the actual difference may end up being different from
    the value of `diff` as computed above. The actual value of the difference will be passed on to the `done_cb` callback within the `next_trial` structure (see below).

*   `options`: The general options. It contains the parameters passed on to `nAFC_adapt`, including the custom ones, but also `current_difference`, which was the difference applied during the last trial (it is equal to `starting_difference` on the first trial).

*   `condition`: You can use this field to specify the type of condition you're testing. For instance you can use a label to distinguish between a condition "A" and a condition "B", that then allows you to write a generic function for the preparation of all your stimuli, since most of the code would likely be the same for different conditions.

*   `done_cb`: This is a callback with a single argument `next_trial` you need to call once your function's finished. If the function is synchronous, then just call it at the end. If it is asynchronous, you can pass that as callback to the asynchronous function. The function takes one argument: `next_trial`, which is an object with the following properties:

    - `stimuli`: The list of sound files to load. Will be used to pre-load the stimuli before the trial begins.
    - `i_correct`: The index of the correct response.
    - `trial_definition`: The parameters that define the trial (can be anything, string, array, or object).
    - `step`: The step used to create the new trial.
    - `difference`: The difference used to create the new trial. This is used to update `options.current_difference`.

This callback is executed as the main function in a (`jspsych-waitfor-function`)[jspsych-waitfor-function.md] trial. That means a loader will be displayed on the page (for at least 1 s) while this is running.

### `after_the_run()`

This callback is called after a run is finished, i.e. after the procedure has converged and a threshold has been obtained, or when there's been too many trials, or a difference too large has been requested. You can use this to send data to the server. It has the following signature:

```javascript
function after_the_run(options, condition, data, success_cb) {
    ...
}
```

Here are the arguments:

*   `options`: The general options.

*   `condition`: The condition label (or definition).

*   `data`: This is a jsPsych [DataCollection](https://www.jspsych.org/core_library/jspsych-data/#datacollection) object containing the trials of the run. At the end of the run, a new row is added with `type: 'threshold'`, containing the threshold information.

*   `success_cb`: You have to call this callback once you're done. It takes no argument (or optionally some data you might want to add to the jsPsych experiment data). If the function is synchronous, just call it at the end of your function. If it runs asynchronously, pass the callback to your async function.
