// Rally Roadbook icon set: 24×24 monoline symbols, stroke = currentColor.
// Replaces every emoji glyph in the UI so icons render identically on all OSes.
// The sprite is injected once into <body>; markup references it via <use href="#icon-...">.

const SPRITE = `
<svg id="icon-sprite" style="display:none" aria-hidden="true"><defs>
  <symbol id="icon-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M15.3 8.7l-2 4.6-4.6 2 2-4.6z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></symbol>
  <symbol id="icon-timer" viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2"/><path d="M9.5 2.5h5"/><path d="M12 2.5v3"/></symbol>
  <symbol id="icon-flag" viewBox="0 0 24 24"><path d="M6 3v18"/><path d="M6 4.5h12l-2.4 3.3L18 11H6"/></symbol>
  <symbol id="icon-mountain" viewBox="0 0 24 24"><path d="M2.5 19h19"/><path d="M4 19l6-11 4 6 2-3 4 8"/><circle cx="17.2" cy="6" r="1.5" fill="currentColor" stroke="none"/></symbol>
  <symbol id="icon-peaks" viewBox="0 0 24 24"><path d="M2.5 19h19"/><path d="M4 19l6-11 4 6 2-3 4 8"/><path d="M9.1 10.9l1.3 1.3M18.3 13.3l.9.9"/></symbol>
  <symbol id="icon-dunes" viewBox="0 0 24 24"><circle cx="18" cy="6.2" r="2.1" fill="currentColor" stroke="none"/><path d="M2 16.5c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 20h20"/></symbol>
  <symbol id="icon-palm" viewBox="0 0 24 24"><path d="M12 21V11"/><path d="M12 11c-3-1.2-5 .3-6.7 3M12 11c-3.5-2.1-4.2-5-2.8-7.2M12 11c1-3 3.7-3.9 6.1-2.8M12 11c3 .2 5.1 2.5 5.8 5.2M12 11c1.7-2.5 1.2-5.6-.8-7.5"/><path d="M3.5 21h17"/></symbol>
  <symbol id="icon-id-card" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.6" cy="11" r="2"/><path d="M5.8 16.2c.6-1.9 4.6-1.9 5.2 0"/><path d="M13.6 10h5M13.6 13h5"/></symbol>
  <symbol id="icon-camera" viewBox="0 0 24 24"><path d="M4 8h3l1.4-2h7.2L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.3"/></symbol>
  <symbol id="icon-trophy" viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 5H4a3 3 0 0 0 3 5"/><path d="M17 5h3a3 3 0 0 1-3 5"/><path d="M12 13v3"/><path d="M9 20h6"/><path d="M10 17h4v3h-4z"/></symbol>
  <symbol id="icon-speaker" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M19.5 7a7.5 7.5 0 0 1 0 10"/></symbol>
  <symbol id="icon-speaker-mute" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.2 9.3l4.8 5.4"/><path d="M21 9.3l-4.8 5.4"/></symbol>
  <symbol id="icon-pin" viewBox="0 0 24 24"><path d="M12 21s7-7.3 7-12a7 7 0 1 0-14 0c0 4.7 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/></symbol>
  <symbol id="icon-arrow" viewBox="0 0 24 24"><path d="M4 12h16"/><path d="M14 6l6 6-6 6"/></symbol>
  <symbol id="icon-chevron-up" viewBox="0 0 24 24"><path d="M5 15.5l7-7 7 7"/></symbol>
  <symbol id="icon-close" viewBox="0 0 24 24"><path d="M5 5l14 14"/><path d="M19 5L5 19"/></symbol>
  <symbol id="icon-download" viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></symbol>
  <symbol id="icon-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6.5l8.5 7 8.5-7"/></symbol>
  <symbol id="icon-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H10l-4 4V5z"/></symbol>
  <symbol id="icon-refresh" viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.9-5.4M20 12a8 8 0 0 1-13.9 5.4"/><path d="M18 3v4h-4"/><path d="M6 21v-4h4"/></symbol>
  <symbol id="icon-gamepad" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="9" rx="4"/><path d="M8 10.5v4M6 12.5h4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18.3" cy="13.3" r="1" fill="currentColor" stroke="none"/></symbol>
  <symbol id="icon-truck" viewBox="0 0 24 24"><path d="M2.5 16V10h9l4 4h3.5a1 1 0 0 1 1 1v1"/><path d="M9 10V7h5l3 3"/><circle cx="7.2" cy="17" r="1.8"/><circle cx="17.5" cy="17" r="1.8"/></symbol>
  <symbol id="icon-link-external" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/><path d="M14 4h6v6"/><path d="M20 4l-9 9"/></symbol>
  <symbol id="icon-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="9.5" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></symbol>
  <symbol id="icon-rotate-device" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="16" rx="1.8"/><path d="M20 8a6 6 0 1 1-2-4.5"/><path d="M20 2.5v4h-4"/></symbol>
  <symbol id="icon-tree" viewBox="0 0 24 24"><path d="M12 3L6.5 11h3l-4 6h13l-4-6h3L12 3z"/><path d="M12 17v4"/></symbol>
  <symbol id="icon-wave" viewBox="0 0 24 24"><path d="M2 10.5c2-3.4 4.5-3.4 6.5 0s4.5 3.4 6.5 0 4.5-3.4 6.5 0"/><path d="M2 16.5c2-3.4 4.5-3.4 6.5 0s4.5 3.4 6.5 0 4.5-3.4 6.5 0"/></symbol>
  <symbol id="icon-plane" viewBox="0 0 24 24"><path d="M21.5 3.5L3 10.5l6.5 2.5L12 20l3-6.5z"/><path d="M9.5 13L21.5 3.5"/></symbol>
  <symbol id="icon-rocket" viewBox="0 0 24 24"><path d="M12 2.5c3.5 2 4.5 6.5 3 11l-3 3-3-3c-1.5-4.5-.5-9 3-11z"/><circle cx="12" cy="8.5" r="1.6"/><path d="M9 13.5l-2.5 1 .8 3M15 13.5l2.5 1-.8 3"/><path d="M12 17.5v4"/></symbol>
  <symbol id="icon-map" viewBox="0 0 24 24"><path d="M3 5.5l6-2 6 2 6-2v15l-6 2-6-2-6 2z"/><path d="M9 3.5v15M15 5.5v15"/></symbol>
  <symbol id="icon-palette" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 .5 18c1.6 0 2.4-1 2.4-2 0-1.3-1.2-1.6-1.2-2.6 0-.8.7-1.4 1.7-1.4h2.1A3.5 3.5 0 0 0 21 11.5C21 6.8 16.9 3 12 3z"/><circle cx="7.6" cy="10.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="11" cy="7.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.4" cy="8.6" r="1.1" fill="currentColor" stroke="none"/></symbol>
  <symbol id="icon-briefcase" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></symbol>
  <symbol id="icon-code" viewBox="0 0 24 24"><path d="M8.5 7L4 12l4.5 5"/><path d="M15.5 7L20 12l-4.5 5"/><path d="M13.2 5l-2.4 14"/></symbol>
</defs></svg>`;

// idempotent — safe to import from multiple modules
if (!document.getElementById('icon-sprite')) {
  document.body.insertAdjacentHTML('afterbegin', SPRITE);
}

export function icon(id, cls = 'icon') {
  return `<svg class="${cls}"><use href="#icon-${id}"/></svg>`;
}
