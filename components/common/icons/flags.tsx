import React from 'react';

export function FlagDE(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" aria-hidden="true" {...props}>
      <rect width="5" height="3" y="0" x="0" fill="#000" />
      <rect width="5" height="2" y="1" x="0" fill="#D00" />
      <rect width="5" height="1" y="2" x="0" fill="#FFCE00" />
    </svg>
  );
}

export function FlagGB(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" aria-hidden="true" {...props}>
      <clipPath id="s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function FlagNL(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" aria-hidden="true" {...props}>
      <rect width="9" height="6" fill="#FFF" />
      <rect width="9" height="2" fill="#21468B" y="4" />
      <rect width="9" height="2" fill="#AE1C28" y="0" />
    </svg>
  );
}

export function FlagFR(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" aria-hidden="true" {...props}>
      <rect width="3" height="2" fill="#ED2939" />
      <rect width="2" height="2" fill="#FFF" />
      <rect width="1" height="2" fill="#002395" />
    </svg>
  );
}

export function FlagES(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 500" aria-hidden="true" {...props}>
      <rect width="750" height="500" fill="#c60b1e" />
      <rect width="750" height="250" y="125" fill="#ffc400" />
    </svg>
  );
}

export function FlagHK(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" aria-hidden="true" {...props}>
      <rect width="900" height="600" fill="#DE2910" />
      <path
        d="M414.2 308.8a127.3 127.3 0 0 1-28.5-7.5l29.4-45-42.3-25.7 13.9 51.9a127.2 127.2 0 0 1-22.1 19.3l-18-50.6-32.6 37.1 36.8 38.6a127.3 127.3 0 0 1 5.9 28.9l-53.7-2.6-3.8 49.3 50.8-17.6a127.3 127.3 0 0 1 23.3 17.8l-40.1 35.7 22.9 43.9 33.6-40.9a127.1 127.1 0 0 1 29 5.6l-10 52.8 48.3 11 1.7-53.7a127.1 127.1 0 0 1 18.7-23.7l29.7 44.8 39.4-36.4-47.5-25.2a127.3 127.3 0 0 1-8-28.4l52.7 11.3 19.7-45.8-53.2 7.7a127.4 127.4 0 0 1-13.8-25.9L557 325l-20.9-46.7-32 42.1a127.3 127.3 0 0 1-29.2-5.7l16.2-51.2-47.2-15-6.5 53.1a127 127 0 0 1-23.2 7.2ZM395.7 348c3.2-1.7 6.1.5 6.4 5 .4 4.5-2.2 9.5-6.1 10.9-3.9 1.5-7.4-.5-7.7-5-.3-4.5 3.9-9.1 7.4-10.9zm-46.8-5.7c3.2-1.6 6.1.5 6.5 5 .3 4.5-2.1 9.5-6 10.9-4 1.5-7.5-.5-7.8-5-.3-4.5 3.9-9.1 7.3-10.9zm-26.6 47c3.1-1.6 6.1.5 6.4 5 .4 4.5-2.1 9.5-6 10.9-4 1.5-7.5-.5-7.8-5-.3-4.5 3.8-9.1 7.4-10.9zm17.9 49.3c3.2-1.7 6.1.5 6.4 5 .4 4.5-2.2 9.4-6 10.8-4 1.5-7.5-.5-7.8-4.9-.3-4.5 3.8-9.1 7.4-10.9zm49.2 12.3c3.1-1.6 6 .5 6.4 5 .3 4.5-2.2 9.5-6.1 10.9-3.9 1.4-7.4-.6-7.7-5-.3-4.5 3.9-9.1 7.4-10.9zm45.5-35.3c3.3-1.6 5.3 1.8 4.4 6-.8 4.2-5.1 8-8.9 8.2-3.8.3-6.4-2.8-5.6-7 .8-4.3 6.6-5.6 10.1-7.2z"
        fill="#fff"
      />
    </svg>
  );
}

export function FlagUS(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7410 3900" aria-hidden="true" {...props}>
      <rect width="7410" height="3900" fill="#b22234" />
      <path
        d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410"
        stroke="#fff"
        strokeWidth="300"
      />
      <rect width="2964" height="2100" fill="#3c3b6e" />
      <g fill="#fff">
        <g id="s18">
          <g id="s9">
            <g id="s5">
              <g id="s4">
                <path
                  id="s"
                  d="M247,90 317.534230,307.082039 132.873218,172.917961H361.126782L176.465770,307.082039z"
                />
                <use href="#s" x="494" />
                <use href="#s" x="988" />
                <use href="#s" x="1482" />
                <use href="#s" x="1976" />
              </g>
              <use href="#s" x="2470" />
            </g>
            <use href="#s5" y="420" />
            <use href="#s4" y="840" />
            <use href="#s3" y="1260" />
          </g>
          <use href="#s9" y="840" />
        </g>
        <use href="#s18" x="247" y="210" />
      </g>
    </svg>
  );
}

export function FlagJP(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" aria-hidden="true" {...props}>
      <rect width="900" height="600" fill="#fff" />
      <circle cx="450" cy="300" r="180" fill="#bc002d" />
    </svg>
  );
}

export function FlagCN(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" aria-hidden="true" {...props}>
      <rect width="900" height="600" fill="#de2910" />
      <path
        d="M268.4 179.4l43.5 133.8H93l113.8 82.7L163.4 530l105-76.3 105 76.3-43.4-134.1L443.8 313.2H224.9l43.5-133.8zM415.8 111l4.7 34.6-26.7-23.1 35.1-4.2-27.1-22.5 30 18.2 29.5-19.1-8.5 34.1 27.5 22-34.6-5.8zm41.1 63.8l17.7 30.4-32.9-13.1 36.1 8-19.4-29.4 16.9 30.9 33.7-10.8-24.1 25.5 35.1 3.5-34.7 5zm-33.6 77.2l20.8 17.5 7.1-26.3 16.1 21.6 26.6-7.8-19.4 18.8 28.5 12.3-33-.7 19.8 27.2L465.9 292l-5.6 27.1zm-80.4 39.5l26.9 2.1-14.2-23.3 22 15.6 4.3-26.9 7.6 26.1 25.8-9-19.1 19.1 25.5 10.2-26.9-2.1 14.2 23.3z"
        fill="#ffde00"
      />
    </svg>
  );
}
