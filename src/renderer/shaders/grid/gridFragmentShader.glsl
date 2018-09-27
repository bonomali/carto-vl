precision highp float;

uniform sampler2D tex;

varying highp vec2 uv;

varying highp vec2 featureIDVar;

void main(void) {
    // FIXME: hardcoded values!
    float scale = 1.0/0.22;
    float offset = 0.0;

    // use single band texture as gray level
    float value = scale*(texture2D(tex, uv).a - offset);
    // gl_FragColor = vec4(value, value, value, 1);
    gl_FragColor = vec4(0.0, 1.0, 0.0, 0.5);
}
