'use strict';
/* Piano Practice Planner — offline-first PWA. All data lives on the device (localStorage). */
(() => {
  const KEY = 'pianoPractice.v1';
  const VERSION = '1.2';
  const ICS_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // Present only inside the Android app (see android/…/MainActivity.kt). Native code owns real alarms there.
  const NATIVE = window.Native || null;

  // ---------- language (English / فارسی) ----------
  // Each entry is [English, Persian]. Values can be strings, arrays or functions.
  const STR = {
    appName: ['Piano Practice Planner', 'برنامه‌ریز تمرین پیانو'],
    appShort: ['Piano Practice', 'تمرین پیانو'],
    otherLang: ['فارسی', 'English'],
    changeLang: ['Change language', 'تغییر زبان'],
    tab_today: ['Today', 'امروز'], tab_plan: ['Plan', 'برنامه'], tab_report: ['Report', 'گزارش'], tab_settings: ['Settings', 'تنظیمات'], tab_metronome: ['Metronome', 'مترونوم'],
    title_today: ['Today', 'امروز'], title_plan: ['Practice plan', 'برنامهٔ تمرین'], title_report: ['Weekly report', 'گزارش هفتگی'], title_settings: ['Settings', 'تنظیمات'], title_metronome: ['Metronome', 'مترونوم'],
    days: [['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']],
    daysShort: [['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']],
    daysChart: [['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']],
    st_done: ['Done', 'انجام شد'], st_partial: ['Partial', 'ناقص'], st_skipped: ['Skipped', 'انجام نشد'],
    st_missed: ['Not logged', 'ثبت نشده'], st_now: ['Now', 'الان'], st_upcoming: ['Upcoming', 'پیش رو'], st_extra: ['Extra', 'اضافه'],
    min: [m => m + 'm', m => m + ' دقیقه'],
    hours: [(h, r) => r ? `${h}h ${r}m` : `${h}h`, (h, r) => r ? `${h} ساعت و ${r} دقیقه` : `${h} ساعت`],
    minChart: [m => m + 'm', m => m + 'د'],
    hoursChart: [(h, r) => r ? `${h}h ${r}m` : `${h}h`, (h, r) => r ? `${h}س ${r}د` : `${h}س`],

    saveFail: ['Could not save — storage is full or blocked', 'ذخیره نشد — حافظه پر است یا دسترسی مسدود است'],
    alarmTitle: ['Time to practice piano 🎹', 'وقت تمرین پیانو است 🎹'],
    niceWork: ['Nice work! Logged ✓', 'آفرین! ثبت شد ✓'],
    logged: ['Logged', 'ثبت شد'],

    // Today
    reportReady: ["Last week's report is ready", 'گزارش هفتهٔ گذشته آماده است'],
    view: ['View', 'مشاهده'],
    setupTitle: ["Let's set up your practice week", 'بیایید هفتهٔ تمرینتان را برنامه‌ریزی کنیم'],
    setup1: ['Add your practice books', 'کتاب‌های تمرینتان را اضافه کنید'],
    setup2: ['Add the times you can practice each day', 'زمان‌هایی را که هر روز می‌توانید تمرین کنید اضافه کنید'],
    setup3: ['Turn on reminders in Settings', 'یادآورها را در تنظیمات روشن کنید'],
    setupBtn: ['Set up my plan', 'برنامه‌ام را بچینم'],
    practicing: ['Practicing', 'در حال تمرین'],
    plannedX: [m => `planned ${m}`, m => `برنامه: ${m}`],
    extraSession: ['extra session', 'جلسهٔ اضافه'],
    stopLog: ['Stop &amp; log', 'پایان و ثبت'],
    discard: ['Discard', 'لغو'],
    didYouPractice: [n => `Did you practice? (${n})`, n => `تمرین کردید؟ (${n})`],
    btnDone: ['✓ Done', '✓ انجام شد'], btnPartly: ['Partly…', 'تا حدی…'], btnSkipped: ['✗ Skipped', '✗ انجام نشد'],
    todaysSessions: ["Today's sessions", 'جلسه‌های امروز'],
    noPracticeToday: ['No practice planned today.', 'امروز تمرینی برنامه‌ریزی نشده است.'],
    nextAt: [(d, tm) => ` Next: ${d} at ${tm}.`, (d, tm) => ` جلسهٔ بعد: ${d} ساعت ${tm}.`],
    startExtra: ['▶ Start extra practice', '▶ شروع تمرین اضافه'],
    logPractice: ['+ Log practice', '+ ثبت تمرین'],
    thisWeek: ['This week', 'این هفته'],
    ofPlanned: [m => `of ${m} planned`, m => `از ${m} برنامه‌ریزی‌شده`],
    extraPractice: ['Extra practice', 'تمرین اضافه'],
    practicedX: [m => `${m} practiced`, m => `${m} تمرین`],
    edit: ['Edit', 'ویرایش'],
    practiceNow: ['Practice now', 'وقت تمرین'],
    start: ['▶ Start', '▶ شروع'],
    logDots: ['Log…', 'ثبت…'],
    timerRunning: ['A practice timer is already running. Replace it?', 'یک زمان‌سنج تمرین در حال اجراست. جایگزینش کنم؟'],
    discardTimer: ['Discard this timer without logging?', 'این زمان‌سنج بدون ثبت لغو شود؟'],

    // Log modal
    logSession: ['Log session', 'ثبت جلسه'],
    logPracticeT: ['Log practice', 'ثبت تمرین'],
    outsidePlan: ['Practice outside your plan', 'تمرین خارج از برنامه'],
    date: ['Date', 'تاریخ'],
    howDidItGo: ['How did it go?', 'چطور پیش رفت؟'],
    segPartly: ['½ Partly', '½ تا حدی'],
    minsPracticed: ['Minutes practiced', 'دقیقه‌های تمرین'],
    booksPracticed: ['Books practiced', 'کتاب‌های تمرین‌شده'],
    noteOpt: ['Note (optional)', 'یادداشت (اختیاری)'],
    notePh: ['e.g. Hands separately on bars 12–20', 'مثلاً: دست‌ها جدا، میزان‌های ۱۲ تا ۲۰'],
    save: ['Save', 'ذخیره'], cancel: ['Cancel', 'انصراف'], delete: ['Delete', 'حذف'], remove: ['Remove', 'حذف'],
    deleteLogQ: ['Delete this log?', 'این ثبت حذف شود؟'],
    enterMinutes: ['Enter how many minutes you practiced', 'تعداد دقیقه‌های تمرین را وارد کنید'],
    loggedSkipped: ['Logged as skipped', 'به‌عنوان «انجام نشد» ثبت شد'],
    loggedX: [m => `Logged ${m} ✓`, m => `${m} ثبت شد ✓`],

    // Plan
    practiceBooks: ['Practice books', 'کتاب‌های تمرین'],
    noBooks: ['No books yet — add the books you practice from (e.g. technique, repertoire, sight-reading).',
      'هنوز کتابی ندارید — کتاب‌هایی را که از آن‌ها تمرین می‌کنید اضافه کنید (مثلاً تکنیک، رپرتوار، دیدخوانی).'],
    addBook: ['+ Add book', '+ افزودن کتاب'],
    weeklySchedule: ['Weekly schedule', 'برنامهٔ هفتگی'],
    sessionsPerWeek: [(n, m) => `${n} sessions · ${m} per week`, (n, m) => `${n} جلسه · ${m} در هفته`],
    addSession: ['+ Add session', '+ افزودن جلسه'],
    addBookFirst: ['Add a book first.', 'ابتدا یک کتاب اضافه کنید.'],
    restDay: ['Rest day', 'روز استراحت'],
    addSessionOn: [d => `Add session on ${d}`, d => `افزودن جلسه در ${d}`],
    alarmsAuto: ['Alarms update automatically when you change your schedule.', 'با تغییر برنامه، هشدارها خودکار به‌روز می‌شوند.'],
    reexport: ['Changed your schedule? Re-export calendar reminders in Settings.', 'برنامه را تغییر دادید؟ یادآورهای تقویم را دوباره از تنظیمات بسازید.'],
    editBook: ['Edit book', 'ویرایش کتاب'], addABook: ['Add a book', 'افزودن کتاب'],
    name: ['Name', 'نام'],
    bookPh: ['e.g. Hanon, Bach Inventions, Faber Level 3', 'مثلاً هانون، اینونسیون‌های باخ، فیبر سطح ۳'],
    colour: ['Colour', 'رنگ'], colourN: [n => `Colour ${n}`, n => `رنگ ${n}`],
    removeBookQ: [n => `Remove “${n}”? Past logs keep it in reports.`, n => `«${n}» حذف شود؟ ثبت‌های قبلی همچنان در گزارش‌ها می‌مانند.`],
    editSession: ['Edit session', 'ویرایش جلسه'], addPracticeSession: ['Add practice session', 'افزودن جلسهٔ تمرین'],
    day: ['Day', 'روز'], daysPick: ['Days (pick all that apply)', 'روزها (همهٔ روزهای دلخواه را انتخاب کنید)'],
    // Preset day groups: Mon–Fri / Sat–Sun in English; Sat–Wed / Thu–Fri for Iran.
    weekdays: ['Weekdays', 'روزهای کاری'], weekdaysSet: ['1,2,3,4,5', '6,0,1,2,3'],
    weekend: ['Weekend', 'آخر هفته'], weekendSet: ['0,6', '4,5'],
    everyDay: ['Every day', 'هر روز'],
    startTime: ['Start time', 'ساعت شروع'],
    lengthMin: ['Length (minutes)', 'مدت (دقیقه)'],
    booksForSession: ['Books for this session', 'کتاب‌های این جلسه'],
    deleteSessionQ: ['Delete this session from your weekly plan?', 'این جلسه از برنامهٔ هفتگی حذف شود؟'],
    pickDay: ['Pick at least one day', 'دست‌کم یک روز انتخاب کنید'],
    enterStart: ['Enter a start time and length', 'ساعت شروع و مدت را وارد کنید'],
    scheduleSaved: ['Schedule saved', 'برنامه ذخیره شد'],

    // Report
    prevWeek: ['Previous week', 'هفتهٔ قبل'], nextWeek: ['Next week', 'هفتهٔ بعد'],
    thisWeekSoFar: ['This week (so far)', 'این هفته (تا امروز)'],
    practiced: ['Practiced', 'تمرین‌شده'], ofPlanPct: [p => ` · ${p} of plan`, p => ` · ${p} از برنامه`],
    planned: ['Planned', 'برنامه‌ریزی‌شده'],
    sessionsFullyDone: ['Sessions fully done', 'جلسه‌های کامل'], partlyN: [n => ` · ${n} partly`, n => ` · ${n} ناقص`],
    daysPracticed: ['Days you practiced', 'روزهای تمرین'],
    minutesPerDay: ['Minutes per day', 'دقیقه در هر روز'],
    showTable: ['Show as table', 'نمایش به‌صورت جدول'],
    total: ['Total', 'جمع'],
    byBook: ['By book', 'به تفکیک کتاب'],
    noBookSelected: ['No book selected', 'بدون کتاب'],
    splitNote: ['When a session covers several books, its minutes are split evenly between them.',
      'اگر یک جلسه شامل چند کتاب باشد، دقیقه‌هایش به‌طور مساوی بین آن‌ها تقسیم می‌شود.'],
    dayByDay: ['Day by day', 'روز به روز'],
    mPlanned: [m => `${m} planned`, m => `${m} برنامه‌ریزی‌شده`],
    nothingPlanned: ['Nothing planned', 'برنامه‌ای نبود'],
    shareReport: ['Share report', 'اشتراک‌گذاری گزارش'],
    chartAria: ['Planned versus practiced minutes for each day', 'دقیقه‌های برنامه‌ریزی‌شده در برابر تمرین‌شده در هر روز'],
    chartTip: [(d, a, p) => `${d}: ${a} practiced of ${p} planned`, (d, a, p) => `${d}: ${a} تمرین از ${p} برنامه`],
    shareTitle: [w => `🎹 Piano practice — ${w}`, w => `🎹 تمرین پیانو — ${w}`],
    shareLine: [(a, p, pc) => `Practiced ${a} of ${p} planned${pc}`, (a, p, pc) => `${a} تمرین از ${p} برنامه‌ریزی‌شده${pc}`],
    shareSessions: [(d, pa, s, m) => `Sessions: ${d} done, ${pa} partly, ${s} skipped, ${m} not logged`,
      (d, pa, s, m) => `جلسه‌ها: ${d} انجام شد، ${pa} ناقص، ${s} انجام نشد، ${m} ثبت نشده`],
    shareByBook: ['By book: ', 'به تفکیک کتاب: '],
    unspecified: ['Unspecified', 'نامشخص'],
    reportShareTitle: ['Piano practice report', 'گزارش تمرین پیانو'],
    copied: ['Report copied to clipboard', 'گزارش کپی شد'],

    // Settings — Android alarms
    nextAlarm: [(d, tm) => `Next alarm: <b>${d} at ${tm}</b>`, (d, tm) => `هشدار بعدی: <b>${d} ساعت ${tm}</b>`],
    noAlarms: ['No alarms scheduled yet — add sessions in Plan.', 'هنوز هشداری تنظیم نشده — در بخش «برنامه» جلسه اضافه کنید.'],
    alarms: ['Alarms', 'هشدارها'], practiceAlarms: ['⏰ Practice alarms', '⏰ هشدارهای تمرین'],
    on: ['On', 'روشن'], needsAttention: ['Needs attention', 'نیاز به بررسی'],
    alarmsDesc: ['Each planned session rings like an alarm clock, even when the app is closed or the phone is locked. Once a session is logged, its alarm is skipped.',
      'هر جلسهٔ برنامه‌ریزی‌شده مثل ساعت زنگ‌دار به صدا درمی‌آید، حتی وقتی برنامه بسته یا گوشی قفل است. وقتی جلسه‌ای ثبت شود، هشدار آن دیگر زنگ نمی‌زند.'],
    fix: ['Fix', 'درست کن'],
    notifAllowed: ['Notifications allowed', 'اجازهٔ اعلان'], notifHelp: ['Without this, Android blocks the alarm.', 'بدون این اجازه، اندروید هشدار را مسدود می‌کند.'],
    exactTiming: ['Exact alarm timing', 'زمان‌بندی دقیق هشدار'], exactHelp: ['Lets the alarm ring at the exact minute.', 'باعث می‌شود هشدار دقیقاً سر وقت زنگ بزند.'],
    fullScreen: ['Full-screen alarm on lock screen', 'هشدار تمام‌صفحه روی صفحهٔ قفل'],
    fullHelp: ['Optional: without it you get a ringing notification instead of a full screen.', 'اختیاری: بدون آن، به‌جای صفحهٔ کامل یک اعلان زنگ‌دار می‌بینید.'],
    ring: ['Ring', 'زمان زنگ'], alertMe: ['Alert me', 'زمان هشدار'],
    minBefore: [m => `${m} minutes before`, m => `${m} دقیقه قبل`], atStart: ['At start time', 'سر ساعت شروع'],
    notifyReport: ['Notify me when my weekly report is ready (end of week, 8 PM)', 'وقتی گزارش هفتگی آماده شد خبرم کن (آخر هفته، ساعت ۲۰)'],
    testAlarm: ['Test alarm (rings in 10 s)', 'آزمایش هشدار (۱۰ ثانیه بعد زنگ می‌زند)'],
    alarmTip: ['Tip: lock the phone after tapping Test to see the full-screen alarm. If alarms ever stop, check Settings → Apps → Piano Practice → Battery and choose “Unrestricted”.',
      'نکته: بعد از زدن «آزمایش هشدار» گوشی را قفل کنید تا هشدار تمام‌صفحه را ببینید. اگر هشدارها از کار افتادند، به تنظیمات گوشی ← برنامه‌ها ← تمرین پیانو ← باتری بروید و «بدون محدودیت» را انتخاب کنید.'],
    testWillRing: ['Test alarm will ring in 10 seconds', 'هشدار آزمایشی ۱۰ ثانیه دیگر زنگ می‌زند'],

    // Settings — web version
    installTitle: ['Install the app on your phone', 'برنامه را روی گوشی نصب کنید'],
    iosSteps: ['<li>Open this page in <b>Safari</b></li><li>Tap the <b>Share</b> button</li><li>Choose <b>Add to Home Screen</b></li><li>Always open Practice from the home-screen icon (your data lives there)</li>',
      '<li>این صفحه را در <b>Safari</b> باز کنید</li><li>دکمهٔ <b>Share</b> را بزنید</li><li><b>Add to Home Screen</b> را انتخاب کنید</li><li>همیشه برنامه را از آیکون صفحهٔ اصلی باز کنید (داده‌هایتان آنجاست)</li>'],
    androidSteps: ['<li>Open this page in <b>Chrome</b></li><li>Tap the <b>⋮</b> menu</li><li>Choose <b>Install app</b> / <b>Add to Home screen</b></li>',
      '<li>این صفحه را در <b>Chrome</b> باز کنید</li><li>منوی <b>⋮</b> را بزنید</li><li><b>Install app</b> یا <b>Add to Home screen</b> را انتخاب کنید</li>'],
    reminders: ['Reminders', 'یادآورها'],
    calAlarms: ['📅 Calendar alarms', '📅 هشدارهای تقویم'], mostReliable: ['Most reliable', 'مطمئن‌ترین'],
    calDesc: ["Adds every planned session to your phone's calendar as a repeating weekly event with an alarm — it rings even when this app is closed.",
      'همهٔ جلسه‌های برنامه را به‌صورت رویداد هفتگی تکرارشونده با هشدار به تقویم گوشی اضافه می‌کند — حتی وقتی این برنامه بسته است زنگ می‌زند.'],
    alsoReport: ['Also remind me to check my weekly report (end of week, 8 PM)', 'یادآوری دیدن گزارش هفتگی را هم اضافه کن (آخر هفته، ساعت ۲۰)'],
    addToCal: ['Add to my calendar', 'افزودن به تقویم'], shareIcs: ['Share .ics file…', 'اشتراک‌گذاری فایل تقویم…'],
    howImport: ['How to import', 'روش وارد کردن'],
    importHtml: ['<p><b>iPhone:</b> tap “Add to my calendar”, then “Add All”. Tip: pick a separate calendar named “Piano” so you can delete it and re-import after changing your plan.</p><p><b>Android:</b> open the downloaded <i>piano-practice.ics</i> with your Calendar app (Samsung Calendar opens it directly). With Google Calendar, import it at calendar.google.com → Settings → Import &amp; export.</p><p>Each time you change your schedule, remove the old events and import again.</p>',
      '<p><b>آیفون:</b> «افزودن به تقویم» و سپس «Add All» را بزنید. نکته: یک تقویم جدا به نام «پیانو» انتخاب کنید تا بعد از تغییر برنامه بتوانید آن را پاک کنید و دوباره وارد کنید.</p><p><b>اندروید:</b> فایل دانلودشدهٔ <i>piano-practice.ics</i> را با برنامهٔ تقویم باز کنید (تقویم سامسونگ مستقیم بازش می‌کند). برای تقویم گوگل، آن را در calendar.google.com ← Settings ← Import &amp; export وارد کنید.</p><p>هر بار که برنامه را تغییر می‌دهید، رویدادهای قبلی را پاک کنید و دوباره وارد کنید.</p>'],
    appNotifs: ['🔔 App notifications', '🔔 اعلان‌های برنامه'],
    status: ['Status', 'وضعیت'],
    perm_granted: ['On', 'روشن'], perm_denied: ['Blocked in system settings', 'در تنظیمات گوشی مسدود است'],
    perm_default: ['Off', 'خاموش'], perm_unsupported: ['Not supported here', 'اینجا پشتیبانی نمی‌شود'],
    notifLimit: [ios => `Phone browsers can't wake a closed web app on a schedule, so these fire only while Practice is open or recently used.${ios ? ' On iPhone they need the app added to your Home Screen (iOS 16.4+).' : ''} Use calendar alarms for dependable reminders.`,
      ios => `مرورگر گوشی نمی‌تواند برنامهٔ وب بسته را سر وقت بیدار کند، پس این اعلان‌ها فقط وقتی برنامه باز است یا تازه استفاده شده نمایش داده می‌شوند.${ios ? ' در آیفون باید برنامه به صفحهٔ اصلی اضافه شده باشد (iOS 16.4 به بالا).' : ''} برای یادآوری مطمئن از هشدارهای تقویم استفاده کنید.`],
    turnOn: ['Turn on', 'روشن کن'], sendTest: ['Send test', 'ارسال آزمایشی'],
    preferences: ['Preferences', 'ترجیحات'],
    language: ['Language', 'زبان'],
    weekStartsOn: ['Week starts on', 'شروع هفته'],
    yourData: ['Your data', 'داده‌های شما'],
    dataDesc: ['Everything is stored only on this device. Back up now and then, or to move to a new phone.',
      'همه‌چیز فقط روی همین دستگاه ذخیره می‌شود. هر از گاهی، یا برای انتقال به گوشی جدید، پشتیبان بگیرید.'],
    exportBackup: ['Export backup', 'گرفتن پشتیبان'], importBackup: ['Import backup', 'بازگردانی پشتیبان'], eraseAll: ['Erase all', 'پاک کردن همه'],
    saved: ['Saved', 'ذخیره شد'],
    about: ['About', 'درباره'],
    madeBy: ['Made by', 'طراحی و ساخت'],
    madeByName: ['Mahsa Mousavi', 'مهسا موسوی'],
    orderedBy: ['Commissioned by', 'به سفارش'],
    orderedByName: ['Ostad Pouria Armanfar', 'استاد پوریا آرمان‌فر'],
    version: [v => `Version ${v}`, v => `نسخهٔ ${v}`],

    // Calendar export
    calName: ['Piano Practice', 'تمرین پیانو'],
    calEvent: ['🎹 Piano practice', '🎹 تمرین پیانو'],
    calOpenAfter: ['Open the Practice app afterwards to log it.', 'بعد از تمرین، برنامه را باز کنید و آن را ثبت کنید.'],
    calReport: ['🎹 Check your piano week', '🎹 مرور هفتهٔ تمرین پیانو'],
    calReportDesc: ['Open the Practice app → Report to see how much you practiced this week.', 'برنامهٔ تمرین ← گزارش را باز کنید تا ببینید این هفته چقدر تمرین کردید.'],
    calReportAlarm: ['Your weekly piano report is ready', 'گزارش هفتگی پیانوی شما آماده است'],
    addSessionsFirst: ['Add some sessions to your plan first', 'ابتدا چند جلسه به برنامه اضافه کنید'],
    remindersExported: [n => `${n} weekly reminders exported`, n => `${n} یادآور هفتگی ساخته شد`],
    icsShareTitle: ['Piano practice reminders', 'یادآورهای تمرین پیانو'],
    notifOnToast: ['Notifications on', 'اعلان‌ها روشن شد'],
    testReminder: ['🎹 Test reminder', '🎹 یادآور آزمایشی'],
    testReminderBody: ['This is how practice reminders will look.', 'یادآورهای تمرین این‌طور نمایش داده می‌شوند.'],
    replaceAllQ: ['Replace everything on this device with this backup?', 'همهٔ اطلاعات این دستگاه با این پشتیبان جایگزین شود؟'],
    restored: ['Backup restored', 'پشتیبان بازگردانی شد'],
    badBackup: ['That file is not a valid backup', 'این فایل پشتیبان معتبری نیست'],
    eraseQ1: ['Erase all books, schedule and practice logs on this device?', 'همهٔ کتاب‌ها، برنامه و ثبت‌های تمرین روی این دستگاه پاک شود؟'],
    eraseQ2: ['Really erase everything? This cannot be undone.', 'واقعاً همه‌چیز پاک شود؟ این کار برگشت‌پذیر نیست.'],
    timeToPractice: ['🎹 Time to practice', '🎹 وقت تمرین است'],
    timeToPracticeBang: ['Time to practice!', 'وقت تمرین است!'],
    startTimerBtn: ['▶ Start practice timer', '▶ شروع زمان‌سنج تمرین'],
    logIt: ['Log it', 'ثبتش کن'], later: ['Later', 'بعداً'],

    // Metronome
    bpm: ['BPM', 'ضرب در دقیقه'], tempo: ['Tempo', 'سرعت'],
    slower: ['Slower', 'آهسته‌تر'], faster: ['Faster', 'تندتر'],
    startMetro: ['▶ Start', '▶ شروع'], stopMetro: ['■ Stop', '■ توقف'],
    tap: ['Tap tempo', 'تعیین با ضربه'],
    timeSig: ['Time signature', 'کسر میزان'],
    subdiv: ['Subdivision', 'تقسیم ضرب'],
    subNames: [['♩ Quarter', '♫ Eighths', '³ Triplets', '♬ Sixteenths'], ['♩ سیاه', '♫ چنگ', '³ تریوله', '♬ دولاچنگ']],
    accentFirst: ['Accent the first beat', 'تأکید روی ضرب اول'],
    tempoNames: [['Largo', 'Adagio', 'Andante', 'Moderato', 'Allegro', 'Vivace', 'Presto', 'Prestissimo'],
      ['لارگو', 'آداجیو', 'آندانته', 'مودراتو', 'آلگرو', 'ویواچه', 'پرستو', 'پرستیسیمو']],
    metroTip: ["Tip: use the phone's volume buttons (media volume) to make it louder. The screen stays on while the metronome is playing.",
      'نکته: صدای مترونوم را با دکمه‌های صدای گوشی (صدای رسانه) زیاد کنید. تا وقتی مترونوم روشن است، صفحه خاموش نمی‌شود.'],
    noAudio: ['Sound is not available on this device', 'پخش صدا روی این دستگاه ممکن نیست'],

    // Strings used by the Android side (alarm screen, notifications)
    n_start: ['▶  Start practicing', '▶  شروع تمرین'], n_startShort: ['▶ Start', '▶ شروع'],
    n_snooze: ['Snooze 10 minutes', '۱۰ دقیقه بعد دوباره'], n_snoozeShort: ['Snooze 10 min', 'تعویق ۱۰ دقیقه'],
    n_dismiss: ['Dismiss', 'بستن'],
    n_reportTitle: ['Your piano week is done 🎹', 'هفتهٔ تمرین پیانوی شما تمام شد 🎹'],
    n_reportBody: ['Tap to see how much you practiced this week.', 'برای دیدن میزان تمرین این هفته ضربه بزنید.'],
    n_testBody: ['This is a test alarm. Your real alarms will look like this.', 'این یک هشدار آزمایشی است. هشدارهای واقعی شما این‌طور خواهند بود.'],
    n_chAlarm: ['Practice alarms', 'هشدارهای تمرین'], n_chAlarmDesc: ["Rings when it's time to practice", 'وقت تمرین زنگ می‌زند'],
    n_chReport: ['Weekly report', 'گزارش هفتگی'],
    n_backupSaved: ['Backup saved', 'پشتیبان ذخیره شد'],
  };
  const deviceFa = () => /^fa\b/i.test(navigator.language || '');
  const isFa = () => S.settings.lang === 'fa';
  const t = (k, ...a) => {
    const e = STR[k]; if (!e) return k;
    const v = e[isFa() ? 1 : 0] ?? e[0];
    return typeof v === 'function' ? v(...a) : v;
  };
  /** Persian digits in Farsi mode. */
  const N = x => isFa() ? String(x).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(x);
  const pctS = p => isFa() ? N(p) + '٪' : p + '%';
  // fa-IR gives the Persian (Solar Hijri) calendar and Persian digits.
  const LOC = () => isFa() ? 'fa-IR' : (deviceFa() ? 'en-US' : undefined);
  const DAY = () => t('days');
  const DAY3 = () => t('daysShort');

  // ---------- state ----------
  const fresh = () => {
    const lang = deviceFa() ? 'fa' : 'en';
    return {
      version: 1,
      books: [],   // {id, name, color, removed?}
      slots: [],   // {id, day 0-6, start 'HH:MM', minutes, bookIds[], from 'YYYY-MM-DD', removed?}
      logs: [],    // {id, date, slotId|null, status, minutes, planned, bookIds[], note}
      settings: { lang, weekStart: lang === 'fa' ? 6 : 1, leadMin: 0, reportSeen: null, reportEvent: true, metro: { bpm: 80, beats: 4, sub: 1, accent: true } },
      timer: null, // {startedAt, date, slotId|null}
    };
  };
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw), f = fresh();
        return { ...f, ...s, settings: { ...f.settings, ...(s.settings || {}) } };
      }
    } catch (e) { /* fall through */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast(t('saveFail')); }
    syncNative();
  }
  /** Hand the current plan (and the alarm texts in the chosen language) to the Android alarm scheduler. No-op in the browser. */
  function syncNative() {
    if (!NATIVE) return;
    const tk = todayKey();
    const slots = S.slots.filter(s => slotActive(s, tk) || (s.from > tk && !s.removed)).map(s => {
      const names = s.bookIds.map(book).filter(b => b && !b.removed).map(b => b.name).join(listSep());
      return { id: s.id, day: s.day, start: s.start, minutes: s.minutes, title: t('alarmTitle'), body: `${fmtTime(s.start)} · ${fmtMin(s.minutes)}${names ? ' · ' + names : ''}` };
    });
    const logged = S.logs.filter(l => l.slotId && l.date >= tk).map(l => `${l.date}|${l.slotId}`);
    const report = S.settings.reportEvent && slots.length ? { day: (S.settings.weekStart + 6) % 7, start: '20:00' } : null;
    const strings = {};
    ['start', 'startShort', 'snooze', 'snoozeShort', 'dismiss', 'reportTitle', 'reportBody', 'testBody', 'chAlarm', 'chAlarmDesc', 'chReport', 'backupSaved']
      .forEach(k => { strings[k] = t('n_' + k); });
    strings.title = t('alarmTitle'); strings.share = t('shareReport');
    try { NATIVE.syncAlarms(JSON.stringify({ lang: S.settings.lang, strings, leadMin: S.settings.leadMin, slots, logged, report })); } catch (e) { /* bridge unavailable */ }
  }

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const todayKey = () => keyOf(new Date());
  const toMin = tm => { const [h, m] = tm.split(':').map(Number); return h * 60 + m; };
  const at = (k, tm) => { const d = fromKey(k), m = toMin(tm); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d; };
  const fmtTime = tm => at('2000-01-01', tm).toLocaleTimeString(LOC(), { hour: 'numeric', minute: '2-digit' });
  const fmtMin = m => { m = Math.round(m || 0); if (m < 60) return t('min', N(m)); const h = Math.floor(m / 60), r = m % 60; return t('hours', N(h), r ? N(r) : 0); };
  const fmtMinChart = m => { m = Math.round(m || 0); if (!m) return N(0); if (m < 60) return t('minChart', N(m)); const h = Math.floor(m / 60), r = m % 60; return t('hoursChart', N(h), r ? N(r) : 0); };
  const fmtDate = (k, o = { weekday: 'short', month: 'short', day: 'numeric' }) => fromKey(k).toLocaleDateString(LOC(), o);
  const weekStartOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() - S.settings.weekStart + 7) % 7)); };
  const weekLabel = ws => `${fmtDate(keyOf(ws), { month: 'short', day: 'numeric' })} – ${fmtDate(keyOf(addDays(ws, 6)), { month: 'short', day: 'numeric' })}`;
  const dayOrder = () => [0, 1, 2, 3, 4, 5, 6].map(i => (i + S.settings.weekStart) % 7);
  const listSep = () => isFa() ? '، ' : ', ';
  // Arrows that point "back" / "forward" in the reading direction.
  const arrowBack = () => isFa() ? '›' : '‹';
  const arrowFwd = () => isFa() ? '‹' : '›';

  const book = id => S.books.find(b => b.id === id);
  const activeBooks = () => S.books.filter(b => !b.removed);
  const bookColor = b => b ? `var(--b${(b.color % 8) + 1})` : 'var(--muted)';
  const bookChips = ids => (ids || []).map(book).filter(Boolean)
    .map(b => `<span class="chip"><i class="dot" style="background:${bookColor(b)}"></i>${esc(b.name)}</span>`).join('');
  const slotActive = (s, k) => (!s.from || s.from <= k) && (!s.removed || k < s.removed);

  /** Planned sessions + logs for a given day. */
  function sessionsOn(k) {
    const dow = fromKey(k).getDay();
    const planned = S.slots.filter(s => s.day === dow && slotActive(s, k))
      .sort((a, b) => a.start.localeCompare(b.start))
      .map(s => ({ slot: s, log: S.logs.find(l => l.date === k && l.slotId === s.id) }));
    const ids = new Set(planned.map(p => p.slot.id));
    const others = S.logs.filter(l => l.date === k && (!l.slotId || !ids.has(l.slotId)))
      .map(l => ({ slot: l.slotId ? S.slots.find(s => s.id === l.slotId) : null, log: l, extra: !l.slotId }));
    return [...planned, ...others];
  }
  function statusOf(e, k, now = new Date()) {
    if (e.log) return e.extra ? 'extra' : e.log.status;
    const st = at(k, e.slot.start), en = new Date(st.getTime() + e.slot.minutes * 60000);
    return now < st ? 'upcoming' : now < en ? 'now' : 'missed';
  }
  const plannedOf = e => e.extra ? 0 : (e.log?.planned ?? e.slot?.minutes ?? 0);

  function upsertLog(d) {
    const ex = d.id ? S.logs.find(l => l.id === d.id)
      : d.slotId ? S.logs.find(l => l.date === d.date && l.slotId === d.slotId) : null;
    if (ex) Object.assign(ex, d, { updated: Date.now() });
    else S.logs.push({ id: uid(), created: Date.now(), ...d });
    save();
  }
  function quickLog(k, slotId, status) {
    const s = S.slots.find(x => x.id === slotId);
    if (!s) return;
    upsertLog({ date: k, slotId, status, minutes: status === 'done' ? s.minutes : 0, planned: s.minutes, bookIds: [...s.bookIds], note: '' });
    toast(status === 'done' ? t('niceWork') : t('logged'));
    render();
  }

  // ---------- UI plumbing ----------
  let tab = 'today';
  let reportWeek = null;
  const TABS = ['today', 'plan', 'report', 'metronome', 'settings'];
  function go(tb, opts = {}) {
    tab = tb;
    if (tb === 'report') reportWeek = opts.week || reportWeek || weekStartOf(new Date());
    $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tb));
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    $('#title').textContent = t('title_' + tab);
    const v = $('#view');
    v.innerHTML = ({ today: viewToday, plan: viewPlan, report: viewReport, metronome: viewMetronome, settings: viewSettings })[tab]();
    bind(v);
    if (tab === 'metronome') mountMetronome(v);
  }
  /** Apply the chosen language to the page frame (direction, tab labels, title). */
  function applyLang() {
    const fa = isFa(), root = document.documentElement;
    root.lang = fa ? 'fa' : 'en';
    root.dir = fa ? 'rtl' : 'ltr';
    document.title = t('appShort');
    $$('.tabs button').forEach(b => { $('.lbl', b).textContent = t('tab_' + b.dataset.tab); });
    const lb = $('#lang');
    lb.textContent = t('otherLang');
    lb.setAttribute('aria-label', t('changeLang'));
    lb.lang = fa ? 'en' : 'fa';
  }
  function setLang(lang) {
    if (lang !== 'en' && lang !== 'fa' || lang === S.settings.lang) return;
    // Week start follows the language (Monday ↔ Saturday) unless it was changed by hand.
    const def = { en: 1, fa: 6 };
    if (S.settings.weekStart === def[S.settings.lang]) { S.settings.weekStart = def[lang]; reportWeek = null; }
    S.settings.lang = lang;
    applyLang(); save(); render();
  }
  $('#lang').addEventListener('click', () => setLang(isFa() ? 'en' : 'fa'));

  let toastT;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
  }
  const modal = $('#modal');
  function openModal(html, mount) {
    $('#modal-body').innerHTML = html;
    if (!modal.open) modal.showModal();
    mount?.($('#modal-body'));
  }
  const closeModal = () => modal.open && modal.close();
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Delegated actions: <button data-act="name" data-...>
  const actions = {};
  function bind(root) {
    $$('[data-act]', root).forEach(el => {
      el.addEventListener('click', ev => {
        ev.preventDefault();
        const fn = actions[el.dataset.act];
        if (fn) fn(el.dataset, el);
      });
    });
  }
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));

  const doneBtns = (k, slotId) => `
    <button class="btn good small" data-act="quick" data-date="${k}" data-slot="${slotId}" data-status="done">${t('btnDone')}</button>
    <button class="btn small" data-act="log" data-date="${k}" data-slot="${slotId}" data-status="partial">${t('btnPartly')}</button>
    <button class="btn bad small" data-act="quick" data-date="${k}" data-slot="${slotId}" data-status="skipped">${t('btnSkipped')}</button>`;

  // ---------- TODAY ----------
  function viewToday() {
    const k = todayKey(), now = new Date();
    const hasPlan = activeBooks().length && S.slots.some(s => !s.removed);
    let h = `<p class="muted" style="margin-top:0">${esc(fmtDate(k, { weekday: 'long', month: 'long', day: 'numeric' }))}</p>`;

    // Weekly report ready banner
    const lastWs = addDays(weekStartOf(now), -7), lastKey = keyOf(lastWs);
    if (S.settings.reportSeen !== lastKey && weekHasData(lastWs)) {
      h += `<div class="card notice"><div class="row between"><div><strong>${t('reportReady')}</strong><div class="small">${esc(weekLabel(lastWs))}</div></div>
        <button class="btn primary small" data-act="openLastReport">${t('view')}</button></div></div>`;
    }

    if (!hasPlan) {
      h += `<div class="card empty stack">
        <img class="logo" src="icons/logo.png" alt="" style="height:130px;display:block;margin:0 auto">
        <strong>${t('setupTitle')}</strong>
        <ol class="steps" style="text-align:start">
          <li>${t('setup1')}</li>
          <li>${t('setup2')}</li>
          <li>${t('setup3')}</li>
        </ol>
        <button class="btn primary" data-act="goto" data-tab="plan">${t('setupBtn')}</button>
        <p class="small muted">${t('orderedBy')} ${t('orderedByName')}</p>
      </div>`;
    }

    // Running timer
    if (S.timer) {
      const s = S.timer.slotId && S.slots.find(x => x.id === S.timer.slotId);
      h += `<div class="card highlight">
        <div class="small muted">${t('practicing')} · ${s ? t('plannedX', fmtMin(s.minutes)) : t('extraSession')}</div>
        <div class="timer-big" id="timer-el">${fmtElapsed()}</div>
        <div class="btn-row"><button class="btn primary" data-act="stopTimer">${t('stopLog')}</button>
        <button class="btn" data-act="goto" data-tab="metronome">♩ ${t('tab_metronome')}</button>
        <button class="btn ghost" data-act="cancelTimer">${t('discard')}</button></div></div>`;
    }

    // Unlogged sessions from previous days
    const pending = pendingSessions();
    if (pending.length) {
      h += `<h2>${t('didYouPractice', N(pending.length))}</h2>`;
      h += pending.map(({ k: d, e }) => `<div class="card">
        <div class="row between"><div><span class="time">${esc(fmtDate(d))} · ${esc(fmtTime(e.slot.start))}</span>
        <span class="muted small"> · ${fmtMin(e.slot.minutes)}</span></div></div>
        <div class="chips">${bookChips(e.slot.bookIds)}</div>
        <div class="btn-row">${doneBtns(d, e.slot.id)}</div></div>`).join('');
    }

    // Today's sessions
    const entries = sessionsOn(k);
    if (hasPlan || entries.length) {
      h += `<h2>${t('todaysSessions')}</h2>`;
      if (!entries.length) h += `<div class="card muted">${t('noPracticeToday')}${nextSessionText()}</div>`;
      h += entries.map(e => sessionCard(e, k, now)).join('');
      h += `<div class="btn-row"><button class="btn" data-act="startTimer">${t('startExtra')}</button>
        <button class="btn ghost" data-act="log" data-date="${k}">${t('logPractice')}</button></div>`;

      // Week progress
      const w = weekData(weekStartOf(now));
      const pct = w.planned ? Math.min(100, Math.round(w.actual / w.planned * 100)) : (w.actual ? 100 : 0);
      h += `<h2>${t('thisWeek')}</h2><div class="card" data-act="goto" data-tab="report" style="cursor:pointer">
        <div class="row between"><strong>${fmtMin(w.actual)} <span class="muted" style="font-weight:400">${t('ofPlanned', fmtMin(w.planned))}</span></strong><span class="muted small">${pctS(pct)} ${arrowFwd()}</span></div>
        <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div></div>`;
    }
    return h;
  }
  function sessionCard(e, k, now) {
    const st = statusOf(e, k, now);
    const time = e.slot ? fmtTime(e.slot.start) : t('extraPractice');
    const ids = e.log?.bookIds ?? e.slot?.bookIds;
    let body = '';
    if (e.log) {
      body = `<div class="small muted" style="margin-top:4px">${t('practicedX', fmtMin(e.log.minutes))}${e.log.note ? ' · ' + esc(e.log.note) : ''}</div>
        <div class="btn-row"><button class="btn small ghost" data-act="log" data-id="${e.log.id}">${t('edit')}</button></div>`;
    } else if (st === 'missed') {
      body = `<div class="btn-row">${doneBtns(k, e.slot.id)}</div>`;
    } else {
      body = `<div class="btn-row">
        ${S.timer ? '' : `<button class="btn ${st === 'now' ? 'primary' : ''} small" data-act="startTimer" data-date="${k}" data-slot="${e.slot.id}">${t('start')}</button>`}
        <button class="btn good small" data-act="quick" data-date="${k}" data-slot="${e.slot.id}" data-status="done">${t('btnDone')}</button>
        <button class="btn small ghost" data-act="log" data-date="${k}" data-slot="${e.slot.id}">${t('logDots')}</button></div>`;
    }
    return `<div class="card ${st === 'now' ? 'highlight' : ''}">
      <div class="row between"><div><span class="time">${esc(time)}</span>${e.slot && !e.extra ? `<span class="muted small"> · ${fmtMin(plannedOf(e))}</span>` : ''}</div>
      <span class="badge ${st}">${st === 'now' ? t('practiceNow') : t('st_' + st)}</span></div>
      ${ids?.length ? `<div class="chips">${bookChips(ids)}</div>` : ''}${body}</div>`;
  }
  function pendingSessions() {
    const out = [], today = new Date();
    for (let i = 13; i >= 1; i--) {
      const k = keyOf(addDays(today, -i));
      sessionsOn(k).forEach(e => { if (!e.log && !e.extra && e.slot) out.push({ k, e }); });
    }
    return out;
  }
  function nextSessionText() {
    const d0 = new Date();
    for (let i = 1; i <= 7; i++) {
      const k = keyOf(addDays(d0, i)); const e = sessionsOn(k).find(x => x.slot && !x.extra);
      if (e) return t('nextAt', esc(fmtDate(k, { weekday: 'long' })), esc(fmtTime(e.slot.start)));
    }
    return '';
  }

  // Timer
  const fmtElapsed = () => {
    if (!S.timer) return N('0:00');
    const s = Math.floor((Date.now() - S.timer.startedAt) / 1000);
    const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
    return N(h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`);
  };
  setInterval(() => { const el = $('#timer-el'); if (el) el.textContent = fmtElapsed(); }, 1000);

  actions.goto = d => go(d.tab);
  actions.openLastReport = () => go('report', { week: addDays(weekStartOf(new Date()), -7) });
  actions.quick = d => quickLog(d.date, d.slot, d.status);
  actions.startTimer = d => {
    unlockAudio();
    if (S.timer && !confirm(t('timerRunning'))) return;
    S.timer = { startedAt: Date.now(), date: d.date || todayKey(), slotId: d.slot || null };
    save(); closeModal(); go('today');
  };
  actions.cancelTimer = () => { if (confirm(t('discardTimer'))) { S.timer = null; save(); render(); } };
  actions.stopTimer = () => {
    const tm = S.timer; if (!tm) return;
    const mins = Math.max(1, Math.round((Date.now() - tm.startedAt) / 60000));
    S.timer = null; save(); render();
    const s = tm.slotId && S.slots.find(x => x.id === tm.slotId);
    logModal({ date: tm.date, slotId: tm.slotId, minutes: mins, status: s ? (mins >= s.minutes * 0.9 ? 'done' : 'partial') : 'done' });
  };
  actions.log = d => logModal({ id: d.id, date: d.date, slotId: d.slot, status: d.status });

  function logModal({ id, date, slotId, minutes, status }) {
    const existing = id ? S.logs.find(l => l.id === id) : (slotId ? S.logs.find(l => l.date === date && l.slotId === slotId) : null);
    const log = existing || {};
    date = log.date || date || todayKey();
    slotId = log.slotId ?? slotId ?? null;
    const slot = slotId ? S.slots.find(s => s.id === slotId) : null;
    const st = status || log.status || 'done';
    const mins = minutes ?? log.minutes ?? (slot ? (st === 'partial' ? Math.round(slot.minutes / 2) : slot.minutes) : 30);
    const sel = new Set(log.bookIds || slot?.bookIds || []);
    const books = activeBooks().concat((log.bookIds || []).map(book).filter(b => b && b.removed));
    const seg = { done: t('btnDone'), partial: t('segPartly'), skipped: t('btnSkipped') };
    openModal(`
      <h3>${slot ? t('logSession') : t('logPracticeT')}</h3>
      <p class="muted small">${slot ? `${esc(fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' }))} · ${esc(fmtTime(slot.start))} · ${t('plannedX', fmtMin(slot.minutes))}` : t('outsidePlan')}</p>
      ${slot ? '' : `<label class="field"><span class="label">${t('date')}</span><input type="date" name="date" value="${date}" max="${todayKey()}"></label>`}
      ${slot ? `<div class="field"><span class="label">${t('howDidItGo')}</span><div class="seg">
        ${['done', 'partial', 'skipped'].map(v => `<label><input type="radio" name="status" value="${v}" ${st === v ? 'checked' : ''}><span>${seg[v]}</span></label>`).join('')}
      </div></div>` : ''}
      <label class="field" id="mins-field"><span class="label">${t('minsPracticed')}</span>
        <input type="number" name="minutes" inputmode="numeric" min="0" max="600" value="${mins}"></label>
      ${books.length ? `<div class="field"><span class="label">${t('booksPracticed')}</span><div class="toggle-group">
        ${books.map(b => `<label><input type="checkbox" name="books" value="${b.id}" ${sel.has(b.id) ? 'checked' : ''}><span><i class="dot" style="background:${bookColor(b)}"></i>${esc(b.name)}</span></label>`).join('')}
      </div></div>` : ''}
      <label class="field"><span class="label">${t('noteOpt')}</span><textarea name="note" placeholder="${esc(t('notePh'))}">${esc(log.note || '')}</textarea></label>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn primary" value="save" data-m="save">${t('save')}</button>
        <button class="btn ghost" value="cancel">${t('cancel')}</button>
        ${existing ? `<button class="btn bad push-end" value="del" data-m="del">${t('delete')}</button>` : ''}
      </div>`, f => {
      const syncMins = () => {
        const skipped = f.querySelector('input[name=status]:checked')?.value === 'skipped';
        $('#mins-field', f).style.display = skipped ? 'none' : '';
      };
      $$('input[name=status]', f).forEach(r => r.addEventListener('change', () => {
        const v = r.value, inp = f.elements.minutes;
        if (slot && v === 'done') inp.value = Math.max(+inp.value || 0, slot.minutes);
        syncMins();
      }));
      syncMins();
      f.onsubmit = ev => {
        const m = ev.submitter?.dataset.m;
        if (m === 'del') { if (!confirm(t('deleteLogQ'))) { ev.preventDefault(); return; } S.logs = S.logs.filter(l => l !== existing); save(); render(); return; }
        if (m !== 'save') return;
        const status = slot ? f.querySelector('input[name=status]:checked').value : 'done';
        const minutes = status === 'skipped' ? 0 : Math.max(0, Math.min(600, parseInt(f.elements.minutes.value, 10) || 0));
        if (status !== 'skipped' && !minutes) { ev.preventDefault(); toast(t('enterMinutes')); return; }
        upsertLog({
          id: existing?.id, date: slot ? date : (f.elements.date.value || todayKey()), slotId, status, minutes,
          planned: slot ? (existing?.planned ?? slot.minutes) : 0,
          bookIds: $$('input[name=books]:checked', f).map(i => i.value),
          note: f.elements.note.value.trim(),
        });
        toast(status === 'skipped' ? t('loggedSkipped') : t('loggedX', fmtMin(minutes)));
        render();
      };
    });
  }

  // ---------- PLAN ----------
  function viewPlan() {
    const books = activeBooks();
    let h = `<h2>${t('practiceBooks')}</h2><div class="card">`;
    h += books.length ? books.map(b => `<div class="book-line"><i class="dot" style="background:${bookColor(b)};width:14px;height:14px"></i>
        <div class="grow">${esc(b.name)}</div><button class="btn small ghost" data-act="editBook" data-id="${b.id}">${t('edit')}</button></div>`).join('')
      : `<p class="muted">${t('noBooks')}</p>`;
    h += `<div class="btn-row"><button class="btn small" data-act="editBook">${t('addBook')}</button></div></div>`;

    const tk = todayKey();
    const active = S.slots.filter(s => slotActive(s, tk) || (s.from > tk && !s.removed));
    const total = active.reduce((a, s) => a + s.minutes, 0);
    h += `<h2>${t('weeklySchedule')}</h2><div class="card">
      <div class="row between"><span class="muted small">${t('sessionsPerWeek', N(active.length), fmtMin(total))}</span>
      <button class="btn small primary" data-act="editSlot" ${books.length ? '' : 'disabled'}>${t('addSession')}</button></div>`;
    if (!books.length) h += `<p class="small muted">${t('addBookFirst')}</p>`;
    for (const d of dayOrder()) {
      const list = active.filter(s => s.day === d).sort((a, b) => a.start.localeCompare(b.start));
      const mins = list.reduce((a, s) => a + s.minutes, 0);
      h += `<div class="day-block"><div class="row between"><strong>${DAY()[d]}</strong>
        <span class="row small muted">${mins ? fmtMin(mins) : t('restDay')}
        ${books.length ? `<button class="btn small ghost" data-act="editSlot" data-day="${d}" aria-label="${esc(t('addSessionOn', DAY()[d]))}">+</button>` : ''}</span></div>
        ${list.map(s => `<button class="slot-line" data-act="editSlot" data-id="${s.id}">
          <span class="time">${esc(fmtTime(s.start))}</span><span class="muted small">${fmtMin(s.minutes)}</span>
          <span class="grow" style="display:flex;gap:4px;justify-content:flex-end">${s.bookIds.map(book).filter(b => b && !b.removed).map(b => `<i class="dot" title="${esc(b.name)}" style="background:${bookColor(b)}"></i>`).join('')}</span></button>`).join('')}
      </div>`;
    }
    h += `</div><p class="small muted">${NATIVE ? t('alarmsAuto') : t('reexport')}</p>`;
    return h;
  }

  actions.editBook = d => {
    const b = d.id ? book(d.id) : null;
    const used = new Set(activeBooks().map(x => x.color));
    let color = b ? b.color : [0, 1, 2, 3, 4, 5, 6, 7].find(c => !used.has(c)) ?? S.books.length % 8;
    openModal(`<h3>${b ? t('editBook') : t('addABook')}</h3>
      <label class="field"><span class="label">${t('name')}</span><input type="text" name="name" maxlength="60" value="${esc(b?.name || '')}" placeholder="${esc(t('bookPh'))}" required></label>
      <div class="field"><span class="label">${t('colour')}</span><div class="toggle-group">
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(c => `<label><input type="radio" name="color" value="${c}" ${c === color ? 'checked' : ''}><span aria-label="${esc(t('colourN', N(c + 1)))}"><i class="dot" style="background:var(--b${c + 1});width:16px;height:16px"></i></span></label>`).join('')}
      </div></div>
      <div class="btn-row" style="margin-top:16px"><button class="btn primary" data-m="save">${t('save')}</button><button class="btn ghost" value="cancel" formnovalidate>${t('cancel')}</button>
      ${b ? `<button class="btn bad push-end" data-m="del" formnovalidate>${t('remove')}</button>` : ''}</div>`, f => {
      setTimeout(() => f.elements.name.focus(), 50);
      f.onsubmit = ev => {
        const m = ev.submitter?.dataset.m;
        if (m === 'del') {
          if (!confirm(t('removeBookQ', b.name))) { ev.preventDefault(); return; }
          b.removed = true; save(); render(); return;
        }
        if (m !== 'save') return;
        const name = f.elements.name.value.trim();
        if (!name) { ev.preventDefault(); return; }
        color = +f.querySelector('input[name=color]:checked').value;
        if (b) Object.assign(b, { name, color }); else S.books.push({ id: uid(), name, color });
        save(); render();
      };
    });
  };

  actions.editSlot = d => {
    const s = d.id ? S.slots.find(x => x.id === d.id) : null;
    const books = activeBooks();
    const days = s ? [s.day] : d.day != null ? [+d.day] : [];
    const last = S.slots[S.slots.length - 1];
    const start = s?.start || last?.start || '17:00';
    const minutes = s?.minutes || last?.minutes || 30;
    const sel = new Set(s ? s.bookIds : books.map(b => b.id));
    const type = s ? 'radio' : 'checkbox';
    openModal(`<h3>${s ? t('editSession') : t('addPracticeSession')}</h3>
      <div class="field"><span class="label">${s ? t('day') : t('daysPick')}</span><div class="toggle-group">
        ${dayOrder().map(i => `<label><input type="${type}" name="day" value="${i}" ${days.includes(i) ? 'checked' : ''}><span>${DAY3()[i]}</span></label>`).join('')}
      </div>${s ? '' : `<div class="presets"><button type="button" class="btn small ghost" data-days="${t('weekdaysSet')}">${t('weekdays')}</button><button type="button" class="btn small ghost" data-days="${t('weekendSet')}">${t('weekend')}</button><button type="button" class="btn small ghost" data-days="0,1,2,3,4,5,6">${t('everyDay')}</button></div>`}</div>
      <label class="field"><span class="label">${t('startTime')}</span><input type="time" name="start" value="${start}" required></label>
      <label class="field"><span class="label">${t('lengthMin')}</span><input type="number" name="minutes" inputmode="numeric" min="5" max="600" value="${minutes}" required>
        <div class="presets">${[15, 20, 30, 45, 60, 90].map(m => `<button type="button" class="btn small ghost" data-min="${m}">${N(m)}</button>`).join('')}</div></label>
      <div class="field"><span class="label">${t('booksForSession')}</span><div class="toggle-group">
        ${books.map(b => `<label><input type="checkbox" name="books" value="${b.id}" ${sel.has(b.id) ? 'checked' : ''}><span><i class="dot" style="background:${bookColor(b)}"></i>${esc(b.name)}</span></label>`).join('')}
      </div></div>
      <div class="btn-row" style="margin-top:16px"><button class="btn primary" data-m="save">${t('save')}</button><button class="btn ghost" value="cancel" formnovalidate>${t('cancel')}</button>
      ${s ? `<button class="btn bad push-end" data-m="del" formnovalidate>${t('delete')}</button>` : ''}</div>`, f => {
      $$('[data-min]', f).forEach(b => b.onclick = () => { f.elements.minutes.value = b.dataset.min; });
      $$('[data-days]', f).forEach(b => b.onclick = () => {
        const want = b.dataset.days.split(',');
        $$('input[name=day]', f).forEach(i => { i.checked = want.includes(i.value); });
      });
      f.onsubmit = ev => {
        const m = ev.submitter?.dataset.m;
        if (m === 'del') {
          if (!confirm(t('deleteSessionQ'))) { ev.preventDefault(); return; }
          deleteSlot(s); save(); render(); return;
        }
        if (m !== 'save') return;
        const dayVals = $$('input[name=day]:checked', f).map(i => +i.value);
        const startV = f.elements.start.value;
        const minV = parseInt(f.elements.minutes.value, 10);
        const bookIds = $$('input[name=books]:checked', f).map(i => i.value);
        if (!dayVals.length) { ev.preventDefault(); toast(t('pickDay')); return; }
        if (!startV || !(minV > 0)) { ev.preventDefault(); toast(t('enterStart')); return; }
        if (s) editSlot(s, { day: dayVals[0], start: startV, minutes: minV, bookIds });
        else dayVals.forEach(day => S.slots.push({ id: uid(), day, start: startV, minutes: minV, bookIds, from: todayKey() }));
        save(); render(); toast(t('scheduleSaved'));
      };
    });
  };
  // Keep history intact: a session that already existed before today is retired and replaced from today on.
  function editSlot(slot, changes) {
    const tk = todayKey();
    if (slot.from && slot.from >= tk) { Object.assign(slot, changes); return; }
    slot.removed = tk;
    const ns = { ...slot, ...changes, id: uid(), from: tk }; delete ns.removed;
    S.slots.push(ns);
    S.logs.forEach(l => { if (l.slotId === slot.id && l.date >= tk) l.slotId = ns.id; });
  }
  function deleteSlot(slot) {
    const tk = todayKey();
    if (slot.from && slot.from >= tk && !S.logs.some(l => l.slotId === slot.id)) S.slots = S.slots.filter(x => x !== slot);
    else slot.removed = tk;
  }

  // ---------- REPORT ----------
  function weekData(ws) {
    const now = new Date(), days = [], byBook = new Map();
    let planned = 0, actual = 0;
    const c = { done: 0, partial: 0, skipped: 0, missed: 0, upcoming: 0, now: 0, extra: 0 };
    for (let i = 0; i < 7; i++) {
      const k = keyOf(addDays(ws, i)), entries = sessionsOn(k);
      let p = 0, a = 0;
      for (const e of entries) {
        p += plannedOf(e);
        const st = statusOf(e, k, now); c[st]++;
        if (e.log) {
          a += e.log.minutes || 0;
          const ids = e.log.bookIds?.length ? e.log.bookIds : ['_'];
          ids.forEach(id => byBook.set(id, (byBook.get(id) || 0) + (e.log.minutes || 0) / ids.length));
        }
      }
      planned += p; actual += a;
      days.push({ k, planned: p, actual: a, entries });
    }
    const scheduled = c.done + c.partial + c.skipped + c.missed + c.upcoming + c.now;
    return { ws, days, planned, actual, c, scheduled, byBook, daysPracticed: days.filter(d => d.actual > 0).length };
  }
  function weekHasData(ws) { const w = weekData(ws); return w.planned > 0 || w.actual > 0; }

  function viewReport() {
    const ws = reportWeek, w = weekData(ws), now = new Date();
    const isPast = addDays(ws, 7) <= now, isCurrent = keyOf(weekStartOf(now)) === keyOf(ws);
    if (isPast && w.planned + w.actual > 0 && keyOf(ws) === keyOf(addDays(weekStartOf(now), -7))) { S.settings.reportSeen = keyOf(ws); save(); }
    const pct = w.planned ? Math.round(w.actual / w.planned * 100) : null;
    let h = `<div class="weeknav"><button class="btn small" data-act="week" data-d="-7" aria-label="${t('prevWeek')}">${arrowBack()}</button>
      <strong>${esc(weekLabel(ws))}${isCurrent ? `<div class="small muted" style="font-weight:400">${t('thisWeekSoFar')}</div>` : ''}</strong>
      <button class="btn small" data-act="week" data-d="7" aria-label="${t('nextWeek')}" ${isCurrent ? 'disabled' : ''}>${arrowFwd()}</button></div>`;
    h += `<div class="tiles">
      <div class="tile"><div class="v">${fmtMin(w.actual)}</div><div class="k">${t('practiced')}${pct != null ? t('ofPlanPct', pctS(pct)) : ''}</div></div>
      <div class="tile"><div class="v">${fmtMin(w.planned)}</div><div class="k">${t('planned')}</div></div>
      <div class="tile"><div class="v">${N(w.c.done)}<span class="muted" style="font-size:15px;font-weight:500"> / ${N(w.scheduled)}</span></div><div class="k">${t('sessionsFullyDone')}${w.c.partial ? t('partlyN', N(w.c.partial)) : ''}</div></div>
      <div class="tile"><div class="v">${N(w.daysPracticed)}<span class="muted" style="font-size:15px;font-weight:500"> / ${N(7)}</span></div><div class="k">${t('daysPracticed')}</div></div></div>`;

    h += `<h2>${t('minutesPerDay')}</h2><div class="card">${dayChart(w)}
      <div class="legend"><span><i style="background:var(--planned)"></i>${t('planned')}</span><span><i style="background:var(--actual)"></i>${t('practiced')}</span></div>
      <details><summary>${t('showTable')}</summary><table class="data" style="margin-top:8px"><thead><tr><th>${t('day')}</th><th class="n">${t('planned')}</th><th class="n">${t('practiced')}</th></tr></thead><tbody>
      ${w.days.map(d => `<tr><td>${esc(fmtDate(d.k))}</td><td class="n">${fmtMin(d.planned)}</td><td class="n">${fmtMin(d.actual)}</td></tr>`).join('')}
      <tr><th>${t('total')}</th><th class="n">${fmtMin(w.planned)}</th><th class="n">${fmtMin(w.actual)}</th></tr></tbody></table></details></div>`;

    const rows = [...w.byBook.entries()].sort((a, b) => b[1] - a[1]);
    if (rows.length) {
      const max = Math.max(...rows.map(r => r[1]));
      h += `<h2>${t('byBook')}</h2><div class="card">${rows.map(([id, m]) => {
        const b = book(id);
        return `<div class="bookbar"><div class="row between small"><span class="row" style="gap:6px"><i class="dot" style="background:${bookColor(b)}"></i>${esc(b ? b.name : t('noBookSelected'))}</span><strong>${fmtMin(m)}</strong></div>
          <div class="track"><div class="fill" style="width:${Math.max(2, m / max * 100)}%;background:${bookColor(b)}"></div></div></div>`;
      }).join('')}<p class="small muted" style="margin-top:10px">${t('splitNote')}</p></div>`;
    }

    h += `<h2>${t('dayByDay')}</h2>`;
    h += w.days.map(d => {
      const items = d.entries.map(e => {
        const st = statusOf(e, d.k, now);
        return `<div class="row between small" style="margin-top:6px"><span>${e.slot && !e.extra ? esc(fmtTime(e.slot.start)) : t('st_extra')} · ${e.log ? fmtMin(e.log.minutes) : t('mPlanned', fmtMin(plannedOf(e)))}${e.log?.note ? ` <span class="muted">— ${esc(e.log.note)}</span>` : ''}</span><span class="badge ${st}">${t('st_' + st)}</span></div>`;
      }).join('');
      return `<div class="card"><div class="row between"><strong>${esc(fmtDate(d.k, { weekday: 'long', month: 'short', day: 'numeric' }))}</strong><span class="small">${fmtMin(d.actual)}${d.planned ? ` <span class="muted">/ ${fmtMin(d.planned)}</span>` : ''}</span></div>
        ${items || `<div class="small muted" style="margin-top:4px">${t('nothingPlanned')}</div>`}</div>`;
    }).join('');
    h += `<div class="btn-row"><button class="btn" data-act="shareReport">${t('shareReport')}</button></div>`;
    return h;
  }

  function dayChart(w) {
    // In Farsi the chart is mirrored: days run right-to-left and the axis sits on the right.
    const rtl = isFa();
    const W = 340, H = 190, AX = rtl ? 44 : 34, B = 24, T = 18, PAD = 4;
    const L = rtl ? PAD : AX, R = rtl ? AX : PAD;
    const max0 = Math.max(30, ...w.days.map(d => Math.max(d.planned, d.actual)));
    const max = Math.ceil(max0 / 30) * 30;
    const y = v => T + (H - T - B) * (1 - v / max);
    const colW = (W - L - R) / 7, bw = Math.min(14, colW * 0.3);
    const top = (x, yy, wd, ht) => {
      if (ht <= 0) return '';
      const r = Math.min(4, ht, wd / 2);
      return `M${x},${yy + ht}V${yy + r}Q${x},${yy} ${x + r},${yy}H${x + wd - r}Q${x + wd},${yy} ${x + wd},${yy + r}V${yy + ht}Z`;
    };
    const tk = todayKey(), labels = t('daysChart');
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('chartAria'))}" style="direction:ltr">`;
    [0, max / 2, max].forEach(v => {
      s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)" stroke-width="1"/>`;
      s += rtl ? `<text x="${W - R + 6}" y="${y(v) + 4}" text-anchor="start">${fmtMinChart(v)}</text>`
        : `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmtMinChart(v)}</text>`;
    });
    w.days.forEach((d, i) => {
      const col = rtl ? 6 - i : i;
      const cx = L + colW * col + colW / 2, base = y(0);
      const ph = base - y(d.planned), ah = base - y(d.actual);
      // "Planned" bar comes first in reading order.
      const px = rtl ? cx + 1 : cx - bw - 1, ax = rtl ? cx - bw - 1 : cx + 1;
      s += `<path d="${top(px, y(d.planned), bw, ph)}" fill="var(--planned)"/>`;
      s += `<path d="${top(ax, y(d.actual), bw, ah)}" fill="var(--actual)"/>`;
      if (d.actual > 0) s += `<text class="val" x="${ax + bw / 2}" y="${y(d.actual) - 4}" text-anchor="middle">${N(Math.round(d.actual))}</text>`;
      const dow = fromKey(d.k).getDay();
      s += `<text x="${cx}" y="${H - 6}" text-anchor="middle" ${d.k === tk ? 'style="font-weight:700;fill:var(--text)"' : ''}>${labels[dow]}</text>`;
      s += `<rect class="hit" x="${L + colW * col}" y="0" width="${colW}" height="${H}" data-tip="${esc(t('chartTip', fmtDate(d.k), fmtMin(d.actual), fmtMin(d.planned)))}"/>`;
    });
    return s + `</svg>`;
  }
  // chart tooltip
  const tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip);
  let tipT;
  document.addEventListener('pointerover', e => {
    const el = e.target.closest?.('[data-tip]'); if (!el) return;
    tip.textContent = el.dataset.tip; tip.style.display = 'block';
    const r = el.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2)) + 'px';
    tip.style.top = Math.max(8, r.top + 8) + 'px';
    clearTimeout(tipT); tipT = setTimeout(() => { tip.style.display = 'none'; }, 2500);
  });
  document.addEventListener('pointerout', e => { if (e.target.closest?.('[data-tip]') && e.pointerType === 'mouse') tip.style.display = 'none'; });

  actions.week = d => { reportWeek = addDays(reportWeek, +d.d); render(); };
  actions.shareReport = async () => {
    const w = weekData(reportWeek);
    const lines = [
      t('shareTitle', weekLabel(reportWeek)),
      t('shareLine', fmtMin(w.actual), fmtMin(w.planned), w.planned ? ` (${pctS(Math.round(w.actual / w.planned * 100))})` : ''),
      t('shareSessions', N(w.c.done), N(w.c.partial), N(w.c.skipped), N(w.c.missed)),
      '',
      ...w.days.map(d => `${fmtDate(d.k)}: ${fmtMin(d.actual)}${d.planned ? ` / ${fmtMin(d.planned)}` : ''}`),
    ];
    const rows = [...w.byBook.entries()].sort((a, b) => b[1] - a[1]);
    if (rows.length) lines.push('', t('shareByBook') + rows.map(([id, m]) => `${book(id)?.name || t('unspecified')} ${fmtMin(m)}`).join(listSep()));
    const text = lines.join('\n');
    try {
      if (NATIVE) NATIVE.share(text);
      else if (navigator.share) await navigator.share({ title: t('reportShareTitle'), text });
      else { await navigator.clipboard.writeText(text); toast(t('copied')); }
    } catch (e) { /* user cancelled */ }
  };

  // ---------- METRONOME ----------
  // Clicks are scheduled ahead on the Web Audio clock (not setTimeout), so the beat stays steady.
  const metro = { on: false, nextTime: 0, beat: 0, sub: 0, timer: null, raf: 0, queue: [], taps: [], wake: null, saveT: null };
  const MS = () => S.settings.metro;
  const BPM_MIN = 30, BPM_MAX = 250;
  const tempoName = b => t('tempoNames')[b < 60 ? 0 : b < 76 ? 1 : b < 108 ? 2 : b < 120 ? 3 : b < 156 ? 4 : b < 176 ? 5 : b < 200 ? 6 : 7];
  const beatDots = () => Array.from({ length: MS().beats }, (_, i) => `<i class="${i === 0 && MS().accent ? 'acc' : ''}"></i>`).join('');

  function viewMetronome() {
    const m = MS();
    return `<div class="card metro">
      <div class="beats" id="m-beats" aria-hidden="true">${beatDots()}</div>
      <div class="bpm-row">
        <button class="btn round" data-act="mStep" data-d="-1" aria-label="${t('slower')}">−</button>
        <div><div class="bpm-num" id="m-bpm">${N(m.bpm)}</div><div class="small muted">${t('bpm')} · <span id="m-name">${tempoName(m.bpm)}</span></div></div>
        <button class="btn round" data-act="mStep" data-d="1" aria-label="${t('faster')}">+</button>
      </div>
      <input type="range" id="m-slider" min="${BPM_MIN}" max="${BPM_MAX}" value="${m.bpm}" aria-label="${t('tempo')}">
      <div class="btn-row center">
        <button class="btn primary big" id="m-toggle" data-act="mToggle">${metro.on ? t('stopMetro') : t('startMetro')}</button>
        <button class="btn big" data-act="mTap">${t('tap')}</button>
      </div></div>
      <div class="card">
        <div class="field" style="margin-top:0"><span class="label">${t('timeSig')}</span><div class="toggle-group">
          ${[2, 3, 4, 5, 6].map(b => `<label><input type="radio" name="mbeats" value="${b}" ${m.beats === b ? 'checked' : ''}><span dir="ltr">${N(b)}/${N(b === 6 ? 8 : 4)}</span></label>`).join('')}
        </div></div>
        <div class="field"><span class="label">${t('subdiv')}</span><div class="toggle-group">
          ${[1, 2, 3, 4].map((v, i) => `<label><input type="radio" name="msub" value="${v}" ${m.sub === v ? 'checked' : ''}><span>${t('subNames')[i]}</span></label>`).join('')}
        </div></div>
        <label class="row small" style="margin-top:14px"><input type="checkbox" id="m-accent" ${m.accent ? 'checked' : ''}> ${t('accentFirst')}</label>
      </div>
      <p class="small muted">${t('metroTip')}</p>`;
  }
  function mountMetronome(v) {
    $('#m-slider', v).addEventListener('input', e => setBpm(+e.target.value));
    $$('input[name=mbeats]', v).forEach(r => r.addEventListener('change', () => { MS().beats = +r.value; metro.beat = 0; metroSave(); refreshDots(); }));
    $$('input[name=msub]', v).forEach(r => r.addEventListener('change', () => { MS().sub = +r.value; metro.sub = 0; metroSave(); }));
    $('#m-accent', v).addEventListener('change', e => { MS().accent = e.target.checked; metroSave(); refreshDots(); });
  }
  const refreshDots = () => { const el = $('#m-beats'); if (el) el.innerHTML = beatDots(); };
  // Settings changes are saved shortly after the last change (the slider fires many events).
  function metroSave() { clearTimeout(metro.saveT); metro.saveT = setTimeout(save, 400); }
  function setBpm(b) {
    b = Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(b) || 80));
    MS().bpm = b;
    const n = $('#m-bpm'); if (n) n.textContent = N(b);
    const nm = $('#m-name'); if (nm) nm.textContent = tempoName(b);
    const sl = $('#m-slider'); if (sl && +sl.value !== b) sl.value = b;
    metroSave();
  }
  function click(time, kind) {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.value = { accent: 1760, mid: 1320, beat: 1100, sub: 760 }[kind];
    const vol = { accent: 1, mid: 0.7, beat: 0.7, sub: 0.35 }[kind];
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vol, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    o.connect(g).connect(audioCtx.destination);
    o.start(time); o.stop(time + 0.07);
  }
  function metroTick() {
    const m = MS();
    while (metro.nextTime < audioCtx.currentTime + 0.12) {
      if (metro.beat >= m.beats) metro.beat = 0;
      const onBeat = metro.sub === 0;
      const kind = !onBeat ? 'sub' : m.accent && metro.beat === 0 ? 'accent' : m.accent && m.beats === 6 && metro.beat === 3 ? 'mid' : 'beat';
      click(metro.nextTime, kind);
      if (onBeat) metro.queue.push({ beat: metro.beat, time: metro.nextTime });
      metro.nextTime += 60 / m.bpm / m.sub;
      if (++metro.sub >= m.sub) { metro.sub = 0; metro.beat = (metro.beat + 1) % m.beats; }
    }
  }
  function metroDraw() {
    if (!metro.on) return;
    const now = audioCtx.currentTime; let cur = null;
    while (metro.queue.length && metro.queue[0].time <= now) cur = metro.queue.shift();
    if (cur) $$('#m-beats i').forEach((d, i) => d.classList.toggle('on', i === cur.beat));
    metro.raf = requestAnimationFrame(metroDraw);
  }
  function keepAwake(on) {
    try { if (NATIVE && NATIVE.keepAwake) NATIVE.keepAwake(on); } catch (e) { /* older app build */ }
    if (!NATIVE && 'wakeLock' in navigator) {
      if (on) navigator.wakeLock.request('screen').then(l => { metro.wake = l; }).catch(() => {});
      else { metro.wake?.release?.(); metro.wake = null; }
    }
  }
  function metroStart() {
    unlockAudio();
    if (!audioCtx) { toast(t('noAudio')); return; }
    metro.on = true; metro.beat = 0; metro.sub = 0; metro.queue = [];
    metro.nextTime = audioCtx.currentTime + 0.08;
    metro.timer = setInterval(metroTick, 25); metroTick();
    metro.raf = requestAnimationFrame(metroDraw);
    keepAwake(true); metroUI();
  }
  function metroStop() {
    metro.on = false;
    clearInterval(metro.timer); cancelAnimationFrame(metro.raf);
    $$('#m-beats i').forEach(d => d.classList.remove('on'));
    keepAwake(false); metroUI();
  }
  function metroUI() {
    const b = $('#m-toggle'); if (b) b.textContent = metro.on ? t('stopMetro') : t('startMetro');
    $$('.tabs button').forEach(x => x.classList.toggle('metro-on', metro.on && x.dataset.tab === 'metronome'));
  }
  actions.mToggle = () => metro.on ? metroStop() : metroStart();
  actions.mStep = d => setBpm(MS().bpm + +d.d);
  actions.mTap = () => {
    const now = performance.now();
    metro.taps = metro.taps.filter(x => now - x < 2500).slice(-5);
    metro.taps.push(now);
    if (metro.taps.length >= 2) setBpm(60000 / ((now - metro.taps[0]) / (metro.taps.length - 1)));
  };
  // Stop the click when the app goes to the background.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && metro.on) metroStop(); });

  // ---------- SETTINGS ----------
  const leadOptions = () => [0, 5, 10, 15, 30].map(m => `<option value="${m}" ${S.settings.leadMin === m ? 'selected' : ''}>${m ? t('minBefore', N(m)) : t('atStart')}</option>`).join('');
  function nativeStatus() { try { return JSON.parse(NATIVE.status()); } catch (e) { return {}; } }
  function nativeReminders() {
    const st = nativeStatus();
    const ok = st.notifications && st.exact;
    const check = (good, label, fix, help) => `<div class="row between small" style="margin-top:8px">
      <span>${good ? '✅' : '⚠️'} ${label}</span>${good ? '' : `<button class="btn small" data-act="nativeFix" data-what="${fix}">${t('fix')}</button>`}</div>
      ${good || !help ? '' : `<div class="small muted">${help}</div>`}`;
    let next = '';
    if (st.next) {
      const d = new Date(st.next);
      next = `<p class="small">${t('nextAlarm', esc(d.toLocaleDateString(LOC(), { weekday: 'long' })), esc(d.toLocaleTimeString(LOC(), { hour: 'numeric', minute: '2-digit' })))}</p>`;
    } else next = `<p class="small muted">${t('noAlarms')}</p>`;
    return `<h2>${t('alarms')}</h2><div class="card"><div class="row between"><strong>${t('practiceAlarms')}</strong>
        <span class="badge ${ok ? 'done' : 'missed'}">${ok ? t('on') : t('needsAttention')}</span></div>
      <p class="small">${t('alarmsDesc')}</p>
      ${next}
      ${check(st.notifications, t('notifAllowed'), 'notifications', t('notifHelp'))}
      ${check(st.exact, t('exactTiming'), 'exact', t('exactHelp'))}
      ${check(st.fullScreen, t('fullScreen'), 'fullscreen', t('fullHelp'))}
      <label class="field"><span class="label">${t('ring')}</span><select data-setting="leadMin">${leadOptions()}</select></label>
      <label class="row small" style="margin-top:10px"><input type="checkbox" data-setting="reportEvent" ${S.settings.reportEvent ? 'checked' : ''}> ${t('notifyReport')}</label>
      <div class="btn-row"><button class="btn primary" data-act="nativeTest">${t('testAlarm')}</button></div>
      <p class="small muted">${t('alarmTip')}</p>
      </div>`;
  }
  actions.nativeFix = d => { if (d.what === 'notifications') NATIVE.requestNotifications(); else NATIVE.openSettings(d.what); };
  actions.nativeTest = () => { NATIVE.testAlarm(); toast(t('testWillRing')); };
  window.__nativeToast = msg => toast(msg);
  window.__nativeRefresh = () => { syncNative(); if (tab === 'settings' && !modal.open) render(); };
  window.__nativeOpen = p => {
    if (p.cmd === 'start' && p.slot) actions.startTimer({ date: p.date, slot: p.slot });
    else if (p.cmd === 'log' && p.slot) { go('today'); logModal({ date: p.date, slotId: p.slot }); }
    else if (p.tab && TABS.includes(p.tab)) go(p.tab);
  };

  function viewSettings() {
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    let h = '';
    h += `<h2>${t('language')}</h2><div class="card"><div class="seg two" role="radiogroup" aria-label="${t('language')}">
      <label><input type="radio" name="lang" value="fa" data-setting="lang" ${isFa() ? 'checked' : ''}><span lang="fa">فارسی</span></label>
      <label><input type="radio" name="lang" value="en" data-setting="lang" ${isFa() ? '' : 'checked'}><span lang="en">English</span></label>
    </div></div>`;
    if (NATIVE) h += nativeReminders();
    else if (!isStandalone) {
      h += `<div class="card notice"><strong>${t('installTitle')}</strong>
        <ol class="steps small">${isIOS ? t('iosSteps') : t('androidSteps')}</ol></div>`;
    }
    if (!NATIVE) h += `<h2>${t('reminders')}</h2>
      <div class="card"><strong>${t('calAlarms')}</strong> <span class="badge done">${t('mostReliable')}</span>
        <p class="small">${t('calDesc')}</p>
        <label class="field"><span class="label">${t('alertMe')}</span><select data-setting="leadMin">${leadOptions()}</select></label>
        <label class="row small" style="margin-top:10px"><input type="checkbox" data-setting="reportEvent" ${S.settings.reportEvent ? 'checked' : ''}> ${t('alsoReport')}</label>
        <div class="btn-row"><button class="btn primary" data-act="ics">${t('addToCal')}</button>
        ${navigator.canShare ? `<button class="btn" data-act="icsShare">${t('shareIcs')}</button>` : ''}</div>
        <details><summary>${t('howImport')}</summary><div class="small">${t('importHtml')}</div></details>
      </div>
      <div class="card"><strong>${t('appNotifs')}</strong>
        <p class="small">${t('status')}: <b>${t('perm_' + perm)}</b></p>
        <p class="small muted">${t('notifLimit', isIOS)}</p>
        <div class="btn-row">${perm === 'default' ? `<button class="btn" data-act="notifyOn">${t('turnOn')}</button>` : ''}${perm === 'granted' ? `<button class="btn" data-act="notifyTest">${t('sendTest')}</button>` : ''}</div>
      </div>`;
    h += `<h2>${t('preferences')}</h2><div class="card"><label class="field" style="margin-top:0"><span class="label">${t('weekStartsOn')}</span>
      <select data-setting="weekStart">${[6, 0, 1].map(d => `<option value="${d}" ${S.settings.weekStart === d ? 'selected' : ''}>${DAY()[d]}</option>`).join('')}</select></label></div>`;
    h += `<h2>${t('yourData')}</h2><div class="card"><p class="small muted" style="margin-top:0">${t('dataDesc')}</p>
      <div class="btn-row"><button class="btn" data-act="backup">${t('exportBackup')}</button><button class="btn" data-act="restore">${t('importBackup')}</button>
      <button class="btn bad" data-act="reset">${t('eraseAll')}</button></div></div>`;
    h += `<h2>${t('about')}</h2><div class="card about">
      <img class="logo" src="icons/logo.png" alt="">
      <div class="grow">
        <strong>${t('appName')}</strong>
        <p class="small"><span class="muted">${t('madeBy')}:</span><br><b>${t('madeByName')}</b></p>
        <p class="small"><span class="muted">${t('orderedBy')}:</span><br><b>${t('orderedByName')}</b></p>
        <p class="small muted">${t('version', N(VERSION))}</p>
      </div></div>`;
    return h;
  }
  document.addEventListener('change', e => {
    const el = e.target.closest?.('[data-setting]'); if (!el) return;
    const k = el.dataset.setting;
    if (k === 'lang') { setLang(el.value); toast(t('saved')); return; }
    S.settings[k] = el.type === 'checkbox' ? el.checked : +el.value;
    if (k === 'weekStart') reportWeek = null;
    save(); toast(t('saved'));
  });

  function buildICS() {
    const tk = todayKey(), today = fromKey(tk), lead = S.settings.leadMin;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const tx = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const trigger = lead ? `-PT${lead}M` : 'PT0S';
    const first = day => keyOf(addDays(today, (day - today.getDay() + 7) % 7)).replace(/-/g, '');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Piano Practice Planner//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${tx(t('calName'))}`];
    const event = (uidv, day, start, mins, summary, desc, alarm) => {
      L.push('BEGIN:VEVENT', `UID:${uidv}@piano-practice-planner`, `DTSTAMP:${stamp}`,
        `DTSTART:${first(day)}T${start.replace(':', '')}00`, `DURATION:PT${mins}M`,
        `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAY[day]}`, `SUMMARY:${tx(summary)}`, `DESCRIPTION:${tx(desc)}`,
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${tx(alarm)}`, `TRIGGER:${trigger}`, 'END:VALARM', 'END:VEVENT');
    };
    const slots = S.slots.filter(s => slotActive(s, tk) || (s.from > tk && !s.removed));
    for (const s of slots) {
      const names = s.bookIds.map(book).filter(b => b && !b.removed).map(b => b.name);
      event(s.id, s.day, s.start, s.minutes, t('calEvent'),
        `${fmtMin(s.minutes)}${names.length ? ' · ' + names.join(listSep()) : ''}\n${t('calOpenAfter')}`,
        t('alarmTitle'));
    }
    if (S.settings.reportEvent && slots.length) {
      event('weekly-report', (S.settings.weekStart + 6) % 7, '20:00', 15, t('calReport'), t('calReportDesc'), t('calReportAlarm'));
    }
    L.push('END:VCALENDAR');
    // fold lines to 75 octets (RFC 5545)
    const enc = new TextEncoder();
    const fold = line => {
      const out = []; let cur = '', bytes = 0;
      for (const ch of line) {
        const b = enc.encode(ch).length;
        if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
        cur += ch; bytes += b;
      }
      out.push(cur);
      return out.join('\r\n ');
    };
    return { text: L.map(fold).join('\r\n') + '\r\n', count: slots.length };
  }
  function downloadFile(name, type, text) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  actions.ics = () => {
    const { text, count } = buildICS();
    if (!count) { toast(t('addSessionsFirst')); return; }
    downloadFile('piano-practice.ics', 'text/calendar', text);
    toast(t('remindersExported', N(count)));
  };
  actions.icsShare = async () => {
    const { text, count } = buildICS();
    if (!count) { toast(t('addSessionsFirst')); return; }
    const file = new File([text], 'piano-practice.ics', { type: 'text/calendar' });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: t('icsShareTitle') });
      else downloadFile(file.name, file.type, text);
    } catch (e) { /* cancelled */ }
  };
  actions.notifyOn = async () => {
    unlockAudio();
    try { await Notification.requestPermission(); } catch (e) { /* old Safari */ }
    if (Notification.permission === 'granted') toast(t('notifOnToast'));
    render();
  };
  actions.notifyTest = () => notify(t('testReminder'), t('testReminderBody'), { tag: 'test' });
  actions.backup = () => {
    const name = `piano-practice-backup-${todayKey()}.json`, text = JSON.stringify(S, null, 1);
    if (NATIVE) NATIVE.saveFile(name, 'application/json', text);
    else downloadFile(name, 'application/json', text);
  };
  actions.restore = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = async () => {
      try {
        const data = JSON.parse(await inp.files[0].text());
        if (!Array.isArray(data.books) || !Array.isArray(data.slots) || !Array.isArray(data.logs)) throw new Error('bad');
        if (!confirm(t('replaceAllQ'))) return;
        const f = fresh(); S = { ...f, ...data, settings: { ...f.settings, ...(data.settings || {}) } };
        applyLang(); save(); toast(t('restored')); render();
      } catch (e) { toast(t('badBackup')); }
    };
    inp.click();
  };
  actions.reset = () => {
    if (!confirm(t('eraseQ1'))) return;
    if (!confirm(t('eraseQ2'))) return;
    const lang = S.settings.lang;
    S = fresh(); S.settings.lang = lang; S.settings.weekStart = lang === 'fa' ? 6 : 1;
    save(); go('today');
  };

  // ---------- reminders while the app is running ----------
  let audioCtx;
  function unlockAudio() {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch (e) { /* no audio */ }
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  function chime() {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + i * 0.18);
      g.gain.linearRampToValueAtTime(0.25, t0 + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.18 + 0.9);
      o.connect(g).connect(audioCtx.destination); o.start(t0 + i * 0.18); o.stop(t0 + i * 0.18 + 1);
    });
  }
  async function notify(title, body, opts = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    const o = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [200, 100, 200], lang: S.settings.lang, dir: isFa() ? 'rtl' : 'ltr', ...opts };
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg) { await reg.showNotification(title, o); return true; }
      new Notification(title, o); return true;
    } catch (e) { return false; }
  }
  const firedKey = 'pianoPractice.fired';
  function fired() { try { return JSON.parse(localStorage.getItem(firedKey) || '[]'); } catch (e) { return []; } }
  function markFired(id) { try { localStorage.setItem(firedKey, JSON.stringify([id, ...fired()].slice(0, 50))); } catch (e) { /* ignore */ } }
  function checkReminders() {
    if (NATIVE) { if (tab === 'today' && !modal.open) render(); return; } // Android alarms handle reminders
    const k = todayKey(), now = Date.now(), done = new Set(fired());
    for (const e of sessionsOn(k)) {
      if (e.log || e.extra || !e.slot) continue;
      const st = at(k, e.slot.start).getTime(), fireAt = st - S.settings.leadMin * 60000;
      const end = st + e.slot.minutes * 60000, id = `${k}|${e.slot.id}`;
      if (now >= fireAt && now < end && !done.has(id)) {
        markFired(id);
        const names = e.slot.bookIds.map(book).filter(Boolean).map(b => b.name).join(listSep());
        const body = `${fmtTime(e.slot.start)} · ${fmtMin(e.slot.minutes)}${names ? ' · ' + names : ''}`;
        notify(t('timeToPractice'), body, { tag: id, requireInteraction: true, data: { url: `./?log=${e.slot.id}&date=${k}` } });
        chime();
        if (document.visibilityState === 'visible') practiceNowModal(e.slot, k, body);
      }
    }
    if (tab === 'today' && !modal.open) render();
  }
  function practiceNowModal(slot, k, body) {
    openModal(`<div class="empty" style="padding:8px 0"><div style="font-size:44px">🎹</div><h3>${t('timeToPracticeBang')}</h3><p class="muted">${esc(body)}</p></div>
      <div class="btn-row"><button class="btn primary block" data-act="startTimer" data-date="${k}" data-slot="${slot.id}">${t('startTimerBtn')}</button>
      <button class="btn block" data-act="logFromModal" data-date="${k}" data-slot="${slot.id}">${t('logIt')}</button>
      <button class="btn ghost block" value="later">${t('later')}</button></div>`, f => bind(f));
  }
  actions.logFromModal = d => logModal({ date: d.date, slotId: d.slot });

  setInterval(checkReminders, 20000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { checkReminders(); } });

  // ---------- service worker & deep links ----------
  if ('serviceWorker' in navigator && !NATIVE) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', ev => {
      if (ev.data?.type === 'log') { go('today'); logModal({ date: ev.data.date, slotId: ev.data.slotId }); }
    });
  }
  navigator.storage?.persist?.().catch(() => {});

  const params = new URLSearchParams(location.search);
  applyLang();
  render();
  syncNative();
  if (params.get('start')) {
    actions.startTimer({ date: params.get('date') || todayKey(), slot: params.get('start') });
    history.replaceState(null, '', location.pathname);
  } else if (params.get('log')) {
    logModal({ date: params.get('date') || todayKey(), slotId: params.get('log') });
    history.replaceState(null, '', location.pathname);
  } else if (params.get('tab') && TABS.includes(params.get('tab'))) {
    go(params.get('tab'));
  }
  checkReminders();
})();
