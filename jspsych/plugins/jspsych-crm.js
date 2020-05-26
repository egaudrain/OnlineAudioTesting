/**
 * jspsych-crm
 * Etienne Gaudrain <etienne.gaudrain@cnrs.fr>
 *
 * Plugin for displaying a CRM response grid.
 **/

jsPsych.plugins["crm"] = (function() {
    var plugin = {};

    jsPsych.pluginAPI.registerPreload('crm', 'stimuli', 'audio');

    plugin.info = {
        name: 'crm',
        description: '',
        parameters: {
            stimulus: {
                type: jsPsych.plugins.parameterType.AUDIO,
                pretty_name: 'Stimuli',
                default: undefined,
                description: 'The audio file to be played.'
            },
            colors: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Colors',
                default: undefined,
                array: true,
                description: 'The labels of the colors used in the task.'
            },
            color_values: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Color values',
                default: null,
                description: 'The colors used to display the colors labels and cells. Default values are implemented, but they can be changed here in the form of an object whose keys are the color labels, and values are the colors in any CSS valid format.'
            },
            text_color_values: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Text color values',
                default: 'auto',
                description: 'The colors used to display the text in the cells. Use "auto" (default) to let the program decide black or white depending on brightness of the color. Otherwise, an object whose keys are the color names, and values are strings representing CSS colors.'
            },
            numbers: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Numbers',
                default: undefined,
                array: true,
                description: 'The numbers used in the task.'
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Any content here will be displayed below (or above) the buttons.'
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
            visual_feedback: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Visual feedback',
                default: false,
                description: 'If true, then visual feedback will be provided after the trial ends.'
            },
            correct_response: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'The correct response',
                default: null,
                description: 'This is an object containing color and number of the correct response.'
            },
        }
    }

    plugin.trial = function(display_element, trial) {

        var context = jsPsych.pluginAPI.audioContext();
        if(context !== null) {
            var source;
        } else {
            var audio;
        }

        if(trial.visual_feedback===true && trial.correct_reponse===null)
            throw "'correct_response' has to be defined if visual feedback is requested.";

        if(trial.color_values===null) {
            trial.color_values = {
                red: "#ff3333",
                blue: "#6b6bff",
                green: "#80ee59",
                yellow: "#ffe534",
                pink: "#ff57df",
                purple: "#a522ff",
                brown: "#7a5630",
                black: "#22222",
                white: "#fcfcfc",
                grey: "#8c8c8c",
                gray: "#8c8c8c"
            };
        }

        if(trial.text_color_values=="auto") {
            trial.text_color_values = {};
            for(var c in trial.color_values) {
                var col = parseCSSColor(c);
                var L = 0.299*col[0] + 0.587*col[1] + 0.114*col[2];
                if(L<128)
                    trial.text_color_values[c] = "#ffffff";
                else
                    trial.text_color_values[c] = "#000000";
            }
        }


        function play_audio() {

            // Prepare the next sound to play
            if(context !== null) {
                source = context.createBufferSource();
                source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
                source.connect(context.destination);
                source.onended = function(){
                    if(trial.trial_ends_after_audio) {
                        after_response(null);
                    } else {
                        enable_response();
                    }
                };
                startTime = context.currentTime;
                source.start(startTime);
            } else {
                audio = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
                audio.currentTime = 0;
                audio.addEventListener('ended', function(){
                    if(trial.trial_ends_after_audio) {
                        after_response(null);
                    } else {
                        enable_response();
                    }
                });
                audio.play();
            }
        }

        /*
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
        */

        var html = '';

        //show prompt if there is one
        if(trial.prompt !== null) {
            html += "<p class='jspsych-prompt'>"+trial.prompt+"</p>";
        }

        html += '<div id="jspsych-crm-buttons-container"><table class="jspsych-crm">';
        for(var c of trial.colors) {
            html += "<tr>";
            html += "<th class='crm-"+c+"' style='color: "+trial.color_values[c]+"'>"+c+"</th>";
            for(var n of trial.numbers) {
                html += "<td class='crm-"+c+"' data-value='"+JSON.stringify({color: c, number: n})+"' style='color: "+trial.text_color_values[c]+"; background-color: "+trial.color_values[c]+"'>"+n+"</td>";
            }
            html += "<th class='crm-"+c+"' style='color: "+trial.color_values[c]+"'>"+c+"</th>";
            html += "</tr>";
        }
        html += '</div>';

        $(display_element).html( html );

        function enable_response() {
            $(dispay_element).find("table.jspsych-crm td").css("cursor", "pointer").click( function(e) {
                var choice = JSON.parse(e.currentTarget.getAttribute('data-value'));
                after_response(choice);
            });
        }

        function disable_response() {
            $(dispay_element).find("table.jspsych-crm td").off("click").css("cursor", "default");
        }

        // store response
        var response = {
            rt: null,
            color: null,
            number: null
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
            response.rt = end_time - start_time;

            if(choice!==null) {
                response.color = choice.color;
                response.number = choice.number;
            }

            disable_response();

            if(trial.visual_feedback) {
                var cssClass, n, animation;
                var correct_button = $(display_element).find("table.jspsych-crm td[data-value='"+JSON.stringify(trial.correct_response)+"']");
                var correct = (trial.correct_response.color == response.color) && (trial.correct_response.number == response.number);
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
                source.stop();
                source.onended = function() {}
            } else {
                audio.pause();
                audio.removeEventListener('ended', end_trial);
            }

            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();

            // gather the data to store for the trial
            var trial_data = {
                rt: response.rt,
                stimulus: trial.stimulus,
                response_color: response.color,
                response_number: response.number,
                correct_color: trial.correct.color,
                correct_number: trial.correct.number,
                score: (response.color==trial.correct.color) + (response.number==trial.correct.number)
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

        $(display_element).ready(play_audio);

        // end trial if time limit is set
        if(trial.trial_duration !== null) {
            jsPsych.pluginAPI.setTimeout(function() {
                end_trial();
            }, trial.trial_duration);
        }

    };

    return plugin;
})();


// (c) Dean McNamee <dean@gmail.com>, 2012.
//
// https://github.com/deanm/css-color-parser-js
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// http://www.w3.org/TR/css3-color/
var kCSSColorTable = {
  "transparent": [0,0,0,0], "aliceblue": [240,248,255,1],
  "antiquewhite": [250,235,215,1], "aqua": [0,255,255,1],
  "aquamarine": [127,255,212,1], "azure": [240,255,255,1],
  "beige": [245,245,220,1], "bisque": [255,228,196,1],
  "black": [0,0,0,1], "blanchedalmond": [255,235,205,1],
  "blue": [0,0,255,1], "blueviolet": [138,43,226,1],
  "brown": [165,42,42,1], "burlywood": [222,184,135,1],
  "cadetblue": [95,158,160,1], "chartreuse": [127,255,0,1],
  "chocolate": [210,105,30,1], "coral": [255,127,80,1],
  "cornflowerblue": [100,149,237,1], "cornsilk": [255,248,220,1],
  "crimson": [220,20,60,1], "cyan": [0,255,255,1],
  "darkblue": [0,0,139,1], "darkcyan": [0,139,139,1],
  "darkgoldenrod": [184,134,11,1], "darkgray": [169,169,169,1],
  "darkgreen": [0,100,0,1], "darkgrey": [169,169,169,1],
  "darkkhaki": [189,183,107,1], "darkmagenta": [139,0,139,1],
  "darkolivegreen": [85,107,47,1], "darkorange": [255,140,0,1],
  "darkorchid": [153,50,204,1], "darkred": [139,0,0,1],
  "darksalmon": [233,150,122,1], "darkseagreen": [143,188,143,1],
  "darkslateblue": [72,61,139,1], "darkslategray": [47,79,79,1],
  "darkslategrey": [47,79,79,1], "darkturquoise": [0,206,209,1],
  "darkviolet": [148,0,211,1], "deeppink": [255,20,147,1],
  "deepskyblue": [0,191,255,1], "dimgray": [105,105,105,1],
  "dimgrey": [105,105,105,1], "dodgerblue": [30,144,255,1],
  "firebrick": [178,34,34,1], "floralwhite": [255,250,240,1],
  "forestgreen": [34,139,34,1], "fuchsia": [255,0,255,1],
  "gainsboro": [220,220,220,1], "ghostwhite": [248,248,255,1],
  "gold": [255,215,0,1], "goldenrod": [218,165,32,1],
  "gray": [128,128,128,1], "green": [0,128,0,1],
  "greenyellow": [173,255,47,1], "grey": [128,128,128,1],
  "honeydew": [240,255,240,1], "hotpink": [255,105,180,1],
  "indianred": [205,92,92,1], "indigo": [75,0,130,1],
  "ivory": [255,255,240,1], "khaki": [240,230,140,1],
  "lavender": [230,230,250,1], "lavenderblush": [255,240,245,1],
  "lawngreen": [124,252,0,1], "lemonchiffon": [255,250,205,1],
  "lightblue": [173,216,230,1], "lightcoral": [240,128,128,1],
  "lightcyan": [224,255,255,1], "lightgoldenrodyellow": [250,250,210,1],
  "lightgray": [211,211,211,1], "lightgreen": [144,238,144,1],
  "lightgrey": [211,211,211,1], "lightpink": [255,182,193,1],
  "lightsalmon": [255,160,122,1], "lightseagreen": [32,178,170,1],
  "lightskyblue": [135,206,250,1], "lightslategray": [119,136,153,1],
  "lightslategrey": [119,136,153,1], "lightsteelblue": [176,196,222,1],
  "lightyellow": [255,255,224,1], "lime": [0,255,0,1],
  "limegreen": [50,205,50,1], "linen": [250,240,230,1],
  "magenta": [255,0,255,1], "maroon": [128,0,0,1],
  "mediumaquamarine": [102,205,170,1], "mediumblue": [0,0,205,1],
  "mediumorchid": [186,85,211,1], "mediumpurple": [147,112,219,1],
  "mediumseagreen": [60,179,113,1], "mediumslateblue": [123,104,238,1],
  "mediumspringgreen": [0,250,154,1], "mediumturquoise": [72,209,204,1],
  "mediumvioletred": [199,21,133,1], "midnightblue": [25,25,112,1],
  "mintcream": [245,255,250,1], "mistyrose": [255,228,225,1],
  "moccasin": [255,228,181,1], "navajowhite": [255,222,173,1],
  "navy": [0,0,128,1], "oldlace": [253,245,230,1],
  "olive": [128,128,0,1], "olivedrab": [107,142,35,1],
  "orange": [255,165,0,1], "orangered": [255,69,0,1],
  "orchid": [218,112,214,1], "palegoldenrod": [238,232,170,1],
  "palegreen": [152,251,152,1], "paleturquoise": [175,238,238,1],
  "palevioletred": [219,112,147,1], "papayawhip": [255,239,213,1],
  "peachpuff": [255,218,185,1], "peru": [205,133,63,1],
  "pink": [255,192,203,1], "plum": [221,160,221,1],
  "powderblue": [176,224,230,1], "purple": [128,0,128,1],
  "rebeccapurple": [102,51,153,1],
  "red": [255,0,0,1], "rosybrown": [188,143,143,1],
  "royalblue": [65,105,225,1], "saddlebrown": [139,69,19,1],
  "salmon": [250,128,114,1], "sandybrown": [244,164,96,1],
  "seagreen": [46,139,87,1], "seashell": [255,245,238,1],
  "sienna": [160,82,45,1], "silver": [192,192,192,1],
  "skyblue": [135,206,235,1], "slateblue": [106,90,205,1],
  "slategray": [112,128,144,1], "slategrey": [112,128,144,1],
  "snow": [255,250,250,1], "springgreen": [0,255,127,1],
  "steelblue": [70,130,180,1], "tan": [210,180,140,1],
  "teal": [0,128,128,1], "thistle": [216,191,216,1],
  "tomato": [255,99,71,1], "turquoise": [64,224,208,1],
  "violet": [238,130,238,1], "wheat": [245,222,179,1],
  "white": [255,255,255,1], "whitesmoke": [245,245,245,1],
  "yellow": [255,255,0,1], "yellowgreen": [154,205,50,1]}

function clamp_css_byte(i) {  // Clamp to integer 0 .. 255.
  i = Math.round(i);  // Seems to be what Chrome does (vs truncation).
  return i < 0 ? 0 : i > 255 ? 255 : i;
}

function clamp_css_float(f) {  // Clamp to float 0.0 .. 1.0.
  return f < 0 ? 0 : f > 1 ? 1 : f;
}

function parse_css_int(str) {  // int or percentage.
  if (str[str.length - 1] === '%')
    return clamp_css_byte(parseFloat(str) / 100 * 255);
  return clamp_css_byte(parseInt(str));
}

function parse_css_float(str) {  // float or percentage.
  if (str[str.length - 1] === '%')
    return clamp_css_float(parseFloat(str) / 100);
  return clamp_css_float(parseFloat(str));
}

function css_hue_to_rgb(m1, m2, h) {
  if (h < 0) h += 1;
  else if (h > 1) h -= 1;

  if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
  if (h * 2 < 1) return m2;
  if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
  return m1;
}

function parseCSSColor(css_str) {
  // Remove all whitespace, not compliant, but should just be more accepting.
  var str = css_str.replace(/ /g, '').toLowerCase();

  // Color keywords (and transparent) lookup.
  if (str in kCSSColorTable) return kCSSColorTable[str].slice();  // dup.

  // #abc and #abc123 syntax.
  if (str[0] === '#') {
    if (str.length === 4) {
      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
      if (!(iv >= 0 && iv <= 0xfff)) return null;  // Covers NaN.
      return [((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8),
              (iv & 0xf0) | ((iv & 0xf0) >> 4),
              (iv & 0xf) | ((iv & 0xf) << 4),
              1];
    } else if (str.length === 7) {
      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
      if (!(iv >= 0 && iv <= 0xffffff)) return null;  // Covers NaN.
      return [(iv & 0xff0000) >> 16,
              (iv & 0xff00) >> 8,
              iv & 0xff,
              1];
    }

    return null;
  }

  var op = str.indexOf('('), ep = str.indexOf(')');
  if (op !== -1 && ep + 1 === str.length) {
    var fname = str.substr(0, op);
    var params = str.substr(op+1, ep-(op+1)).split(',');
    var alpha = 1;  // To allow case fallthrough.
    switch (fname) {
      case 'rgba':
        if (params.length !== 4) return null;
        alpha = parse_css_float(params.pop());
        // Fall through.
      case 'rgb':
        if (params.length !== 3) return null;
        return [parse_css_int(params[0]),
                parse_css_int(params[1]),
                parse_css_int(params[2]),
                alpha];
      case 'hsla':
        if (params.length !== 4) return null;
        alpha = parse_css_float(params.pop());
        // Fall through.
      case 'hsl':
        if (params.length !== 3) return null;
        var h = (((parseFloat(params[0]) % 360) + 360) % 360) / 360;  // 0 .. 1
        // NOTE(deanm): According to the CSS spec s/l should only be
        // percentages, but we don't bother and let float or percentage.
        var s = parse_css_float(params[1]);
        var l = parse_css_float(params[2]);
        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;
        return [clamp_css_byte(css_hue_to_rgb(m1, m2, h+1/3) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h-1/3) * 255),
                alpha];
      default:
        return null;
    }
  }

  return null;
}
