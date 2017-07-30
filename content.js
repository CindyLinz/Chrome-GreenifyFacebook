var threshold = .45;

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

function protect_eyes(hsv){
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

function greenify(style, name){
  var value = style.getPropertyValue(name);
  if( !value )
    return;
  var match = value.match(/rgba?\s*\((\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)/);
  if( match ){
    match.shift();
    var hsv = rgb2hsv(match);
    if( .50 < hsv[0] && hsv[0] < .70 ){
      hsv = protect_eyes(hsv);
      var rgb = hsv2rgb(hsv[0]-.3, hsv[1], hsv[2]);
      style.setProperty(name, value.replace(/(rgba?\s*\()(\d+\.?\d*)(\s*,\s*)(\d+\.?\d*)(\s*,\s*)(\d+\.?\d*)/, '$1' + rgb[0] + '$3' + rgb[1] + '$5' + rgb[2]));
    }
  }
}

function prepare_img(canvas){
  var w = canvas.width;
  var h = canvas.height;
  var ctx = canvas.getContext('2d');
  var img_data = ctx.getImageData(0, 0, w, h);
  var data = img_data.data;
  var visited = new Uint8Array(w*h);
  var stack = new Uint32Array(w*h);
  var sp;

  var i, j;
  for(i=w*h-1; i>=0; --i)
    visited[i] = 0;

  var p=3, q=0;
  var ii, jj, pp, qq;
  var has_blue, all_blue;
  var hsv, rgb;
  for(i=0; i<h; ++i)
    for(j=0; j<w; ++j, p+=4, ++q){
      if( visited[q] )
        continue;
      if( data[p]>0 ){
        has_blue = false, all_blue = true;

        visited[q] = 1;
        stack[0] = q;
        sp = 1;
        while( sp>0 ){
          qq = stack[--sp];

          jj = qq % w;
          ii = (qq-jj) / w;

          pp = qq*4;
          hsv = rgb2hsv([data[pp], data[pp+1], data[pp+2]]);
          if( data[pp+3]>30 && hsv[1] > .05 ){
            if( .50 < hsv[0] && hsv[0] < .70 )
              has_blue = true;
            else
              all_blue = false;;
          }

          jj = qq % w;
          ii = (qq-jj) / w;
          if( ii>0 && !visited[qq-w] && data[pp-4*w+3]>0 ){
            visited[qq-w] = 1;
            stack[sp++] = qq-w;
          }
          if( ii<h-1 && !visited[qq+w] && data[pp+4*w+3]>0 ){
            visited[qq+w] = 1;
            stack[sp++] = qq+w;
          }
          if( jj>0 && !visited[qq-1] && data[pp-1]>0 ){
            visited[qq-1] = 1;
            stack[sp++] = qq-1;
          }
          if( jj<w-1 && !visited[qq+1] && data[pp+7]>0 ){
            visited[qq+1] = 1;
            stack[sp++] = qq+1;
          }
        }

        if( !(has_blue && all_blue) )
          continue;

        visited[q] = 2;
        stack[0] = q;
        sp = 1;
        while( sp>0 ){
          qq = stack[--sp];

          pp = qq*4;
          hsv = rgb2hsv([data[pp], data[pp+1], data[pp+2]]);
          if( data[pp+3]>30 && hsv[1] > .05 ){
            hsv = protect_eyes(hsv);
            rgb = hsv2rgb(hsv[0]-.3, hsv[1], hsv[2]);
            data[pp] = rgb[0];
            data[pp+1] = rgb[1];
            data[pp+2] = rgb[2];
          }

          jj = qq % w;
          ii = (qq-jj) / w;
          if( ii>0 && visited[qq-w]==1 && data[pp-4*w+3]>0 ){
            visited[qq-w] = 2;
            stack[sp++] = qq-w;
          }
          if( ii<h-1 && visited[qq+w]==1 && data[pp+4*w+3]>0 ){
            visited[qq+w] = 2;
            stack[sp++] = qq+w;
          }
          if( jj>0 && visited[qq-1]==1 && data[pp-1]>0 ){
            visited[qq-1] = 2;
            stack[sp++] = qq-1;
          }
          if( jj<w-1 && visited[qq+1]==1 && data[pp+7]>0 ){
            visited[qq+1] = 2;
            stack[sp++] = qq+1;
          }
        }
      }
    }

  ctx.putImageData(img_data, 0, 0);
}


var bg_images = {};
function greenify_icon(style){
  var url = style.getPropertyValue('background-image');
  if( !url )
    return;
  var url_match = url.match(/url\("?(.*)"\)/);
  if( !url_match )
    return;
  url = url_match[1];
  if( url.match(/\.gif$/) )
    return;

  var w, h;
  var img_size_match = (''+style.getPropertyValue('background-size')).match(/(\d+\.?\d*)\D+(\d+\.?\d*)/);
  if( !img_size_match )
    return;
  w = img_size_match[1]-0;
  h = img_size_match[2]-0;

  var x, y;
  var img_pos = style.getPropertyValue('background-position');
  var img_pos_match = (''+img_pos).match(/(-?\d+\.?\d*)[^0-9-]+(-?\d+\.?\d*)/);
  if( img_pos_match ){
    x = -img_pos_match[1];
    y = -img_pos_match[2];
  }
  else
    x = y = 0;

  if( bg_images[url] && bg_images[url] instanceof Array )
    bg_images[url].push(style);
  else if( bg_images[url] )
    style.setProperty('background-image', bg_images[url]);
  else{
    bg_images[url] = [style];
    var image = new Image;
    image.onload = function(){
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(image, 0, 0, w, h);
      prepare_img(canvas);
      canvas.toBlob(function(blob){
        var styles = bg_images[url];
        var new_url = bg_images[url] = 'url(' + URL.createObjectURL(blob) + ')';
        each(styles, function(style){
          style.setProperty('background-image', new_url);
        });
      });
    };
    image.src = url;
  }
}

var prepared_sheets = [];

function greenify_style(style){
  greenify(style, 'background-color');
  greenify(style, 'color');
  greenify(style, 'border-color');
  greenify_icon(style);
}

function prepare_sheets(){
  each(document.styleSheets, function(sheet){
    var done = false;
    each(prepared_sheets, function(prepared_sheet){
      if( prepared_sheet===sheet )
        done = true;
    });
    if( done )
      return;

    prepared_sheets.push(sheet);
    each(sheet.cssRules || sheet.rules || [], function(rule){
      if( rule.style )
        greenify_style(rule.style);
    });
  });

  var i, found;
  for(i=0; i<prepared_sheets.length; ++i){
    found = false;
    each(document.styleSheets, function(sheet){
      if( sheet===prepared_sheets[i] )
        found = true;
    });
    if( !found ){
      prepared_sheets[i] = prepared_sheets[prepared_sheets.length-1];
      prepared_sheets.pop();
      --i;
    }
  }
}

var stylesheet_observer = new MutationObserver(function(mutations){
  var need_change = false;
  each(mutations, function(mutation){
    each(mutation.addedNodes, function(node){
      if( node.tagName=='LINK' && node.rel=='stylesheet' )
        need_change = true;
    });
  });
  if( need_change )
    prepare_sheets();
});

var inlinestyle_observer = new MutationObserver(function(mutations){
  each(mutations, function(mutation){
    if( mutation.target.style )
      greenify_style(mutation.target.style);
    if( mutation.target.querySelectorAll )
      each(mutation.target.querySelectorAll('*'), function(node_in_node){
        if( node_in_node.style )
          greenify_style(node_in_node.style);
      });
  });
});

chrome.storage.sync.get('bright', function(items){
  if( 'bright' in items )
    threshold = items.bright / 1000;
  else
    threshold = .45;
  prepare_sheets();

  each(document.querySelectorAll('*'), function(node){
    if( node.style )
      greenify_style(node.style);
  });

  var image = new Image;
  image.onload = function(){
    var canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    prepare_img(canvas);
    canvas.toBlob(function(blob){
      each(document.head.querySelectorAll('link[rel=icon],link[rel="shortcut icon"]'), function(link){
        document.head.removeChild(link);
      });
      var link = document.createElement('link');
      link.rel = 'shortcut icon';
      link.type = 'image/x-icon';
      link.href = URL.createObjectURL(blob);
      document.head.appendChild(link);
    });
  };
  image.src = '/favicon.ico';

  stylesheet_observer.observe(document.head, {childList: true});
  inlinestyle_observer.observe(document.body, {subtree: true, attributes: true, childList: true});
});

chrome.runtime.onMessage.addListener(function(req, sender, res){
  console.warn(req, sender);
  if( req.act=='reload' )
    window.location.reload();
});
