# slider.js

제이쿼리 방식 초기화
$('.slider').slider({ 옵션 });

논 제이쿼리 방식 초기화
const slider = new Slider(셀렉터 또는 엘리먼트, { 옵션 });

# 옵션 목록
interval(기본 값: 3000): 페이지당 대기시간
duration(기본 값: 1000): 다음 페이지로 넘어가는데 걸리는 시간
page_index(기본 값: 0): 시작 페이지 인덱스
page_offset(기본 값: 0): 초기 슬라이드 위치
sensivility(기본 값: 100): 터치 민감도
auto(기본 값: true): 자동으로 넘어가는지에 대한 여부
easing(기본 값: 'easeInOutSine'): 슬라이드가 넘어가는 애니메이션에 사용할 easing 함수

# easing 함수 목록
linear
easeInQuad
easeOutQuad
easeInOutQuad
easeInCubic
easeOutCubic
easeInOutCubic
easeInQuart
easeOutQuart
easeInOutQuart
easeInQuint
easeOutQuint
easeInOutQuint
easeInSine
easeOutSine
easeInOutSine
easeInExpo
easeOutExpo
easeInOutExpo
easeInCirc
easeOutCirc
easeInOutCirc
easeInElastic
easeOutElastic
easeInOutElastic
easeInBack
easeOutBack
easeInOutBack
easeInBounce
easeOutBounce
easeInOutBounce
