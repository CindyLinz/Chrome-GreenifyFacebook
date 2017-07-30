function each(arr, act){
  var i;
  for(i=0; i<arr.length; ++i)
    act(arr[i], i);
}

function rgb2hsv(_rgb){
  var rgb = [];
  var M = 0;
  var m = 1;
  var i;
  for(i=0; i<3; ++i){
    rgb[i] = _rgb[i] / 255;
    if( rgb[i] < m ) m = rgb[i];
    if( rgb[i] > M ) M = rgb[i];
  }
  var c = M - m;
  var h, hh;
  if( c == 0 )
    hh = 0;
  else if( M == rgb[0] )
    hh = (rgb[1]-rgb[2]) / c % 6;
  else if( M == rgb[1] )
    hh = (rgb[2]-rgb[0]) / c + 2;
  else
    hh = (rgb[0]-rgb[1]) / c + 4;
  h = hh / 6;
  var v = M;
  var s;
  if( v == 0 )
    s = 0;
  else
    s = c / v;
  return [h, s, v];
};

function protect_eyes(hsv, threshold){
  if( hsv[1] * hsv[2] > threshold ){
    var factor = Math.sqrt(threshold/(hsv[1]*hsv[2]));
    return [hsv[0], factor*hsv[1], factor*hsv[2]];
  }
  return hsv;
}

function hsv2rgb(h, s, v){
  var c = v * s;
  var m = v - c;
  var hh = h*6;
  var x = c * (1 - Math.abs(hh % 2 - 1));
  var r, g, b;
  if( hh < 1 )
    r=c, g=x, b=0;
  else if( hh < 2 )
    r=x, g=c, b=0;
  else if( hh < 3 )
    r=0, g=c, b=x;
  else if( hh < 4 )
    r=0, g=x, b=c;
  else if( hh < 5 )
    r=x, g=0, b=c;
  else
    r=c, g=0, b=x;
  r += m;
  g += m;
  b += m;
  return [r*255|0,g*255|0,b*255|0];
};

function preview(threshold){
  each(document.querySelectorAll('tr'), function(tr){
    var match = tr.firstChild.style.getPropertyValue('background-color').match(/rgba?\s*\(\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)/);
    match.shift();
    var hsv = protect_eyes(rgb2hsv(match), threshold/1000);
    var rgb = hsv2rgb(hsv[0]-.3, hsv[1], hsv[2]);
    tr.lastChild.style.setProperty('background-color', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
  });
}

var slider = document.querySelector('#slider');

slider.oninput = function(ev){
  preview(ev.target.value);
};

document.querySelector('#default_btn').onclick = function(){
  slider.value = 450;
  preview(slider.value);
};

document.querySelector('#commit_btn').onclick = function(){
  chrome.storage.sync.set({bright: slider.value}, function(){
    chrome.runtime.sendMessage({act: 'reload'});
    chrome.tabs.query({}, function(tabs){
      var waiting = tabs.length;
      each(tabs, function(tab){
        chrome.tabs.sendMessage(tab.id, {act: 'reload'}, function(e){
          --waiting;
          if( waiting==0 )
            window.close();
        });
      });
    });
  });
};

chrome.storage.sync.get('bright', function(items){
  if( 'bright' in items )
    slider.value = items.bright;
  else
    slider.value = 450;
  preview(slider.value);
});
