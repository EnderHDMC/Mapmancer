uniform float time;

#define PI 3.14159265359

float rand(vec2 c){
    return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p, float freq ){
    float unit = 2.0/freq;
    vec2 ij = floor(p/unit);
    vec2 xy = mod(p,unit)/unit;
    //xy = 3.*xy*xy-2.*xy*xy*xy;
    xy = .5*(1.-cos(PI*xy));
    float a = rand((ij+vec2(0.,0.)));
    float b = rand((ij+vec2(1.,0.)));
    float c = rand((ij+vec2(0.,1.)));
    float d = rand((ij+vec2(1.,1.)));
    float x1 = mix(a, b, xy.x);
    float x2 = mix(c, d, xy.x);
    return mix(x1, x2, xy.y);
}

float pNoise(vec2 p, int res){
    float persistance = .5;
    float n = 0.;
    float normK = 0.;
    float f = 4.;
    float amp = 1.;
    int iCount = 0;
    for (int i = 0; i<50; i++){
        n+=amp*noise(p, f);
        f*=2.;
        normK+=amp;
        amp*=persistance;
        if (iCount == res) break;
        iCount++;
    }
    float nf = n/normK;
    return nf*nf*nf*nf;
}

vec4 background(vec2 pos) {
    vec2 position = pos;

    float noise = pNoise(position * 2.0 + time * 0.1, 10);
    vec2 p = position;
    p += noise;
    float noise2 = noise + pNoise(p * 2.0, 1);
    float noise3 = noise2 + pNoise(p * 4.0, 10);
    float noise4 = noise3 + pNoise(p * 8.0, 10);

    float rblend = smoothstep(0.0, 0.7, noise4);
    float yblend = smoothstep(0.5, 0.9, noise4);
    float wblend = smoothstep(0.7, 1.0, noise4);

    vec3 r = vec3(0.0, 1.0, 0.0);
    vec3 y = vec3(1.0, 1.0, 0.0);
    vec3 w = vec3(1.0, 1.0, 1.0);

    vec3 color = rblend * r + yblend * y + wblend * w;
    color = vec3(noise2, noise4, noise3);

    return vec4( color, 1.0 );
}

vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
    vec4 c = def_frag();

    float mask = float(c == vec4(0.0, 1.0, 0.0, 1.0));
    c = mix(c, background(pos), mask);
    return c;
}
