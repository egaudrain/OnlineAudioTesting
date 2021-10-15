<?php
    $html_button = FALSE;
    if(isset($_GET['html-button'])){
        $html_button = TRUE;
    }
?>
<!DOCTYPE html>
<html>

<head>
    <title>Test for jspsych-html-keyboard-response-clickable</title>
    <script src="https://cdn.jsdelivr.net/gh/jspsych/jsPsych@6.2.0/jspsych.js"></script>
    <link href="https://cdn.jsdelivr.net/gh/jspsych/jsPsych@6.2.0/css/jspsych.css" rel="stylesheet" type="text/css">
    <script src="https://cdn.jsdelivr.net/gh/jspsych/jsPsych@6.2.0/plugins/jspsych-html-button-response.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/jspsych/jsPsych@6.2.0/plugins/jspsych-html-keyboard-response.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/jspsych/jsPsych@6.2.0/plugins/jspsych-audio-keyboard-response.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/jspsych/jsPsych@6.2.0/plugins/jspsych-call-function.js"></script>
    <!--
    <script src="/js/vendor/jspsych-6.1.0.js"></script>
    <link href="/css/jspsych.css" rel="stylesheet" type="text/css">
    <script src="/js/vendor/jspsych-plugins/jspsych-html-keyboard-response.js"></script>
    <script src="/js/vendor/jspsych-plugins/jspsych-html-keyboard-response.js"></script>
    <script src="/js/vendor/jspsych-plugins/jspsych-audio-keyboard-response.js"></script>
    -->
    <script src="/js/vendor/jspsych-plugins-dbsplab/jspsych-audio-safari-init.js"></script>
</head>

<body>
<?php
if($html_button){ echo "<h1>With HTML start button</h1>"; }
?>
    <div id='jspsych-wrapper'>
<?php
    if($html_button){
?>
        <button id='expe-start'>START THE EXPERIMENT</button>
<?php
    }
?>
    </div>
    <script>
<?php
    if($html_button){
?>
document.getElementById('expe-start').addEventListener('click', function(){
<?php
    }
?>

    // Without Safari init plugin
    var timeline0 = [];
    timeline0.push({
        type: 'html-keyboard-response',
        choices: [32],
        stimulus: '<h1>Without Safari init plugin</h1><p>Press SPACE when you are ready to listen (or just wait).</p>',
        trial_duration: 2000
    });
    timeline0.push({
        type: 'audio-keyboard-response',
        stimulus: 'res/cat_black_2.mp3',
        prompt: '<p>LISTEN<br>(If it is Safari, there will be no sound)</p>',
        choices: [32]
    });

    // With a simple button
    var timeline1 = [];
    timeline1.push({
        type: 'html-button-response',
        choices: ['START'],
        stimulus: '<h1>With simple start button</h1><p>(The button has no audio context action attached to it)</p>'
    });
    timeline1.push({
        type: 'html-keyboard-response',
        choices: [32],
        trial_duration: 2000,
        stimulus: '<p>Press SPACE when you are ready to listen (or just wait).</p>'
    });
    timeline1.push({
        type: 'audio-keyboard-response',
        stimulus: 'res/cat_black_2.mp3',
        prompt: '<p>LISTEN<br>(If it is Safari, there will be no sound)</p>',
        choices: [32]
    });

    // With Safari init plugin
    var timeline2 = [];
    timeline2.push({
        type: 'audio-safari-init'
    });
    timeline2.push({
        type: 'html-keyboard-response',
        choices: [32],
        stimulus: '<h1>With Safari init plugin</h1><p>Press SPACE when you are ready to listen (or just wait).</p>',
        trial_duration: 2000
    });
    timeline2.push({
        type: 'audio-keyboard-response',
        stimulus: 'res/cat_black_2.mp3',
        prompt: '<p>LISTEN<br>(there should be a sound, even on Safari)</p>',
        choices: [32]
    });

    // With an HTML button
    var timeline3 = [];
    timeline3.push({
        type: 'call-function',
        func: function(){
            window.location.replace('?html-button');
        }
    });

    var timeline_index;

    var timeline = [];
    timeline.push({
        type: 'html-button-response',
        choices: ['without the <code>audio-safari-init</code> plugin', 'with a simple START button', 'with the <code>audio-safari-init</code> plugin'<?php echo ($html_button)?'':', "with HTML button"'; ?>],
        stimulus: "<p>Choose how to start</p>",
        on_finish: function(){
            var data = jsPsych.data.get().last(1).values()[0];
            timeline_index = data.button_pressed;
            console.log("The selected timeline is "+timeline_index);
        }
    });

    timeline.push({
        timeline: timeline0,
        conditional_function: function(){
            console.log('timeline_index='+timeline_index);
            return timeline_index == 0;
        }
    });

    timeline.push({
        timeline: timeline1,
        conditional_function: function(){
            return timeline_index == 1;
        }
    });

    timeline.push({
        timeline: timeline2,
        conditional_function: function(){
            return timeline_index == 2;
        }
    });

<?php
    if(!$html_button){
?>
    timeline.push({
        timeline: timeline3,
        conditional_function: function(){
            return timeline_index == 3;
        }
    });
<?php
    }
?>

    jsPsych.init({
        timeline: timeline,
        display_element: 'jspsych-wrapper',
        use_webaudio: true
    });


<?php
    if($html_button){
?>
});
<?php
    }
?>

    </script>
</body>

</html>
