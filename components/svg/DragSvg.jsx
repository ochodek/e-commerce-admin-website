import React from 'react';

const DragSvg = ({ props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        msTransform: 'rotate(360deg)',
        WebkitTransform: 'rotate(360deg)'
      }}
      viewBox="0 0 24 24"
      transform="rotate(360)"
      {...props}
    >
      <path
        d="M12 16.5a.75.75 0 01.743.648l.007.102v2.188l.72-.718a.75.75 0 01.976-.073l.084.073a.75.75 0 01.073.976l-.073.084-2 2-.038.036-.072.055-.095.055-.086.035-.103.026-.084.011h-.103l-.12-.018-.068-.02-.059-.022-.07-.035-.052-.032-.031-.022a.754.754 0 01-.08-.069l-2-2a.75.75 0 01.977-1.133l.084.073.72.719v-2.19a.75.75 0 01.648-.742L12 16.5zM12 9a3 3 0 110 6 3 3 0 010-6zm6.72.47a.75.75 0 01.976-.073l.084.072 2 2 .036.039.056.072.054.095.035.086.027.103.01.084v.103l-.018.12-.019.068-.022.059-.036.07-.032.052-.027.038-.064.072-2 2a.75.75 0 01-1.133-.976l.073-.085.718-.72H17.25a.75.75 0 01-.743-.647L16.5 12a.75.75 0 01.648-.743l.102-.007h2.19l-.72-.72a.75.75 0 01-.073-.976l.073-.085zm-14.5 0a.75.75 0 011.133.976l-.073.084-.72.72h2.19a.75.75 0 01.743.648L7.5 12a.75.75 0 01-.648.743l-.102.007H4.561l.72.72a.75.75 0 01.072.976l-.073.084a.75.75 0 01-.976.073l-.084-.073-2-2-.091-.11-.055-.095-.035-.086-.026-.103-.012-.09v-.093l.019-.125.02-.067.022-.06.035-.07.032-.052.022-.03a.757.757 0 01.069-.08l2-2zM12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-.136-8.488l.067-.009.087-.003.06.004.094.016.067.019.06.022.07.036.051.032.038.027.072.063 2 2a.75.75 0 01-.976 1.134l-.084-.073-.72-.72v2.19a.75.75 0 01-.648.743L12 7.5a.75.75 0 01-.743-.648l-.007-.102V4.56l-.72.72a.75.75 0 01-.976.073L9.47 5.28a.75.75 0 01-.073-.976l.073-.085 2-2 .11-.09.095-.055.086-.035.103-.027z"
        fill="#fff"
      />
    </svg>
  );
};

export default DragSvg;
