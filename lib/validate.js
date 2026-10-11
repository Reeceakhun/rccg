class Bad extends Error {}
const str = (v, max, label) => { const s = String(v ?? '').trim(); if (s.length > max) throw new Bad(`${label} is too long (max ${max})`); return s; };
const url = (v, label) => { const s = str(v, 500, label); if (s && !/^https?:\/\//i.test(s)) throw new Bad(`${label} must start with http:// or https://`); return s; };
const date = (v, label) => { const s = str(v, 10, label); if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Bad(`${label} must look like 2026-12-25`); return s; };
const arr = (v, max, label) => { if (!Array.isArray(v)) throw new Bad(`${label} must be a list`); if (v.length > max) throw new Bad(`Too many ${label}`); return v; };

function sanitize(b) {
  if (!b || typeof b !== 'object') throw new Bad('Invalid data');
  const soc = b.social || {};
  return {
    name: str(b.name, 120, 'Church name') || 'Our Church', tagline: str(b.tagline, 200, 'Tagline'),
    welcome: str(b.welcome, 1000, 'Welcome message'), about: str(b.about, 4000, 'About text'),
    verseMonth: str(b.verseMonth, 60, 'Verse month'), verseText: str(b.verseText, 1200, 'Verse text'), verseRef: str(b.verseRef, 100, 'Verse reference'),
    stream: url(b.stream, 'Stream URL'), address: str(b.address, 300, 'Address'),
    phone: str(b.phone, 40, 'Phone'), email: str(b.email, 200, 'Email'),
    social: { facebook: url(soc.facebook, 'Facebook URL'), youtube: url(soc.youtube, 'YouTube URL'), instagram: url(soc.instagram, 'Instagram URL') },
    give: str(b.give, 2000, 'Giving message'), giveLink: url(b.giveLink, 'Giving link'), giveBank: str(b.giveBank, 1000, 'Bank details'),
    times: arr(b.times, 20, 'service times').map(r => ({ label: str(r.label, 120, 'Service name'), when: str(r.when, 120, 'Service time') })),
    ministries: arr(b.ministries, 30, 'ministries').map(r => ({ t: str(r.t, 120, 'Ministry name'), d: str(r.d, 1000, 'Ministry description') })),
    events: arr(b.events, 300, 'events').map(r => ({ title: str(r.title, 160, 'Event title'), date: date(r.date, 'Event date'), tag: str(r.tag, 40, 'Event tag'), desc: str(r.desc, 1500, 'Event description') })),
    sermons: arr(b.sermons, 1000, 'sermons').map(r => ({ title: str(r.title, 160, 'Sermon title'), speaker: str(r.speaker, 120, 'Speaker'), date: date(r.date, 'Sermon date'), url: url(r.url, 'Sermon URL') })),
    leaders: arr(b.leaders, 40, 'leaders').map(r => ({ name: str(r.name, 120, 'Leader name'), title: str(r.title, 120, 'Leader title'), bio: str(r.bio, 1000, 'Leader bio') }))
  };
}
module.exports = { sanitize, Bad };
