import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Smartphone,
  Phone,
  BookOpen,
  Clock,
  ArrowRight,
  Shield,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
} from 'lucide-react';

// Quiz questions data - Saudi context
const quizData = {
  phishing: {
    en: [
      { q: 'You receive an email from "noreply@absher-gov.sa" asking you to verify your identity. What should you do?', options: ['Click the link to verify', 'Forward it to a friend', 'Ignore it — official Absher emails come from @absher.sa', 'Reply with your national ID'], correct: 2 },
      { q: 'A bank email warns your account will be closed in 24 hours unless you click a link. This is likely:', options: ['A legitimate warning', 'A phishing attempt using urgency', 'An official SAMA notice', 'A routine security check'], correct: 1 },
      { q: 'Which is a sign that an email is a phishing attempt?', options: ['It has the company logo', 'The sender domain doesn\'t match the official website', 'It was sent during business hours', 'It is written in Arabic'], correct: 1 },
      { q: 'You receive an email from SAMA asking for your bank credentials. What should you do?', options: ['Provide the information — SAMA is official', 'Call your bank using the number on their official website', 'Reply asking for more details', 'Share only your account number'], correct: 1 },
      { q: 'What is the safest way to access your Absher account?', options: ['Click a link in an email', 'Use a search engine link', 'Type absher.sa directly in your browser', 'Use a link from social media'], correct: 2 },
      { q: 'An email offers a job at Saudi Aramco with a very high salary and asks for personal details. This is likely:', options: ['A real opportunity', 'A phishing scam targeting job seekers', 'A recruitment agency email', 'An internal referral'], correct: 1 },
      { q: 'Which email address is most likely legitimate for a Saudi government service?', options: ['service@gov-sa.com', 'support@ministry.gov.sa', 'help@saudi-government.net', 'info@gov.sa.mail.com'], correct: 1 },
      { q: 'A phishing email often contains:', options: ['Perfect grammar only', 'Urgent language and threats', 'Only images with no text', 'A physical mailing address'], correct: 1 },
      { q: 'You notice a colleague clicked a phishing link. What should you do?', options: ['Ignore it', 'Report it to IT security immediately', 'Click the link to check it', 'Wait until they ask for help'], correct: 1 },
      { q: 'What does HTTPS in a URL indicate?', options: ['The site is 100% safe', 'The connection is encrypted', 'The site is government-approved', 'The site has no ads'], correct: 1 },
    ],
    ar: [
      { q: 'تلقيت بريدًا من "noreply@absher-gov.sa" يطلب التحقق من هويتك. ماذا يجب أن تفعل؟', options: ['انقر على الرابط للتحقق', 'أعد توجيهه لصديق', 'تجاهله — رسائل أبشر الرسمية تأتي من @absher.sa', 'رد برقم هويتك الوطنية'], correct: 2 },
      { q: 'بريد من البنك يحذر بإغلاق حسابك خلال 24 ساعة إذا لم تنقر على رابط. هذا على الأرجح:', options: ['تحذير حقيقي', 'محاولة تصيد تستخدم الاستعجال', 'إشعار رسمي من ساما', 'فحص أمني روتيني'], correct: 1 },
      { q: 'ما هي علامة أن البريد الإلكتروني محاولة تصيد؟', options: ['يحتوي على شعار الشركة', 'نطاق المرسل لا يطابق الموقع الرسمي', 'أُرسل أثناء ساعات العمل', 'مكتوب باللغة العربية'], correct: 1 },
      { q: 'تلقيت بريدًا من ساما يطلب بيانات حسابك البنكي. ماذا يجب أن تفعل؟', options: ['قدم المعلومات — ساما جهة رسمية', 'اتصل ببنكك من الرقم على موقعهم الرسمي', 'رد واطلب مزيدًا من التفاصيل', 'شارك رقم حسابك فقط'], correct: 1 },
      { q: 'ما هي الطريقة الأكثر أمانًا للوصول لحساب أبشر؟', options: ['انقر على رابط في بريد إلكتروني', 'استخدم رابط من محرك بحث', 'اكتب absher.sa مباشرة في المتصفح', 'استخدم رابطًا من وسائل التواصل'], correct: 2 },
      { q: 'بريد يعرض وظيفة في أرامكو براتب عالٍ جدًا ويطلب بيانات شخصية. هذا على الأرجح:', options: ['فرصة حقيقية', 'احتيال تصيد يستهدف الباحثين عن عمل', 'بريد وكالة توظيف', 'إحالة داخلية'], correct: 1 },
      { q: 'أي عنوان بريد إلكتروني هو الأكثر احتمالاً أن يكون شرعيًا لخدمة حكومية سعودية؟', options: ['service@gov-sa.com', 'support@ministry.gov.sa', 'help@saudi-government.net', 'info@gov.sa.mail.com'], correct: 1 },
      { q: 'البريد الاحتيالي غالبًا يحتوي على:', options: ['قواعد نحوية مثالية فقط', 'لغة عاجلة وتهديدات', 'صور فقط بدون نص', 'عنوان بريدي فعلي'], correct: 1 },
      { q: 'لاحظت أن زميلك نقر على رابط تصيد. ماذا يجب أن تفعل؟', options: ['تجاهل الأمر', 'أبلغ أمن تقنية المعلومات فورًا', 'انقر على الرابط لفحصه', 'انتظر حتى يطلب المساعدة'], correct: 1 },
      { q: 'ماذا يعني HTTPS في عنوان URL؟', options: ['الموقع آمن 100%', 'الاتصال مشفر', 'الموقع معتمد حكوميًا', 'الموقع خالٍ من الإعلانات'], correct: 1 },
    ],
  },
  smishing: {
    en: [
      { q: 'You receive an SMS saying "Your Nafath code is 4521. Share it with our agent to complete verification." What should you do?', options: ['Share the code', 'Ignore — Nafath codes should only be entered in the app', 'Call the number back', 'Forward the SMS to a friend'], correct: 1 },
      { q: 'A text from "Saudi Post" says your package is held and you need to pay a fee via a link. This is likely:', options: ['Legitimate — pay the fee', 'A smishing scam', 'A customs notification', 'A delivery update'], correct: 1 },
      { q: 'Which is a red flag in an SMS message?', options: ['It comes from a named sender', 'It contains a shortened URL you don\'t recognize', 'It was sent at noon', 'It mentions your name'], correct: 1 },
      { q: 'You get an SMS: "Congratulations! You won 10,000 SAR from STC. Click here to claim." What should you do?', options: ['Click to claim the prize', 'Delete it — this is a common scam', 'Share it on social media', 'Call STC customer service to verify'], correct: 1 },
      { q: 'A fake SADAD SMS might:', options: ['Use perfect Arabic only', 'Ask you to confirm a payment through an unknown link', 'Come from the official SADAD number only', 'Include a payment receipt'], correct: 1 },
      { q: 'What is the best action if you receive a suspicious SMS?', options: ['Reply "STOP"', 'Click the link to investigate', 'Block the number and report it', 'Forward it to friends as a warning'], correct: 2 },
      { q: 'An SMS claims your bank account is frozen and provides a link to unfreeze it. You should:', options: ['Click the link immediately', 'Log into your banking app directly to check', 'Call the number in the SMS', 'Send your account details by SMS'], correct: 1 },
      { q: 'How do scammers make SMS messages look legitimate?', options: ['They always use perfect grammar', 'They spoof sender names to match known organizations', 'They send messages only at night', 'They include long messages'], correct: 1 },
      { q: 'You receive an SMS about a Tawakkalna app update with a download link. What should you do?', options: ['Download from the link', 'Update only through the official app store', 'Share the link with family', 'Ignore app updates'], correct: 1 },
      { q: 'Your friend forwards you an SMS with a "great deal" link. You should:', options: ['Trust it since it\'s from a friend', 'Verify the offer through official channels before clicking', 'Click it — friends wouldn\'t send scams', 'Forward it to more friends'], correct: 1 },
    ],
    ar: [
      { q: 'تلقيت رسالة نصية: "رمز نفاذ الخاص بك هو 4521. شاركه مع موظفنا لإتمام التحقق." ماذا يجب أن تفعل؟', options: ['شارك الرمز', 'تجاهل — أكواد نفاذ يجب إدخالها في التطبيق فقط', 'اتصل بالرقم', 'أعد توجيه الرسالة لصديق'], correct: 1 },
      { q: 'رسالة من "البريد السعودي" تقول إن طردك محتجز وتحتاج لدفع رسوم عبر رابط. هذا على الأرجح:', options: ['حقيقي — ادفع الرسوم', 'احتيال عبر الرسائل النصية', 'إشعار جمركي', 'تحديث توصيل'], correct: 1 },
      { q: 'ما هي علامة التحذير في رسالة نصية؟', options: ['تأتي من مرسل معروف', 'تحتوي على رابط مختصر لا تعرفه', 'أُرسلت في الظهيرة', 'تذكر اسمك'], correct: 1 },
      { q: 'تلقيت رسالة: "مبروك! ربحت 10,000 ريال من STC. انقر هنا للمطالبة." ماذا يجب أن تفعل؟', options: ['انقر للمطالبة بالجائزة', 'احذفها — هذا احتيال شائع', 'شاركها على وسائل التواصل', 'اتصل بخدمة عملاء STC للتحقق'], correct: 1 },
      { q: 'رسالة سداد مزيفة قد:', options: ['تستخدم العربية المثالية فقط', 'تطلب تأكيد دفع عبر رابط مجهول', 'تأتي من رقم سداد الرسمي فقط', 'تتضمن إيصال دفع'], correct: 1 },
      { q: 'ما هو أفضل إجراء عند تلقي رسالة نصية مشبوهة؟', options: ['رد بكلمة "توقف"', 'انقر على الرابط للتحقق', 'احظر الرقم وأبلغ عنه', 'أعد توجيهها للأصدقاء كتحذير'], correct: 2 },
      { q: 'رسالة تدعي أن حسابك البنكي مجمد وتوفر رابطًا لإلغاء التجميد. يجب عليك:', options: ['انقر على الرابط فورًا', 'سجل الدخول لتطبيق البنك مباشرة للتحقق', 'اتصل بالرقم في الرسالة', 'أرسل بيانات حسابك برسالة'], correct: 1 },
      { q: 'كيف يجعل المحتالون الرسائل النصية تبدو شرعية؟', options: ['يستخدمون قواعد نحوية مثالية دائمًا', 'ينتحلون أسماء مرسلين تطابق مؤسسات معروفة', 'يرسلون الرسائل ليلاً فقط', 'يكتبون رسائل طويلة'], correct: 1 },
      { q: 'تلقيت رسالة عن تحديث تطبيق توكلنا مع رابط تحميل. ماذا يجب أن تفعل؟', options: ['حمّل من الرابط', 'حدّث فقط من متجر التطبيقات الرسمي', 'شارك الرابط مع العائلة', 'تجاهل تحديثات التطبيقات'], correct: 1 },
      { q: 'صديقك أرسل لك رسالة بها رابط "عرض رائع". يجب عليك:', options: ['ثق به لأنه من صديق', 'تحقق من العرض عبر القنوات الرسمية قبل النقر', 'انقر عليه — الأصدقاء لن يرسلوا احتيالاً', 'أعد توجيهه لمزيد من الأصدقاء'], correct: 1 },
    ],
  },
  vishing: {
    en: [
      { q: 'You receive a call from someone claiming to be from Ministry of Interior. They ask for your national ID and bank details. What should you do?', options: ['Provide the information', 'Hang up and call the official ministry number', 'Ask them to call back later', 'Share only your national ID'], correct: 1 },
      { q: 'A caller says they are from your bank and need your OTP code to "prevent fraud." This is likely:', options: ['A legitimate fraud prevention call', 'A vishing scam — banks never ask for OTPs by phone', 'A routine security verification', 'An automated bank system'], correct: 1 },
      { q: 'Which is a red flag during a phone call?', options: ['The caller greets you by name', 'The caller creates urgency and threatens consequences', 'The call comes from a local number', 'The caller speaks Arabic'], correct: 1 },
      { q: 'A caller claims you have an unpaid traffic fine and must pay immediately by phone or face arrest. You should:', options: ['Pay immediately to avoid arrest', 'Hang up — verify fines through the official Absher portal', 'Ask for their badge number', 'Transfer money to the given account'], correct: 1 },
      { q: 'What makes vishing calls convincing?', options: ['They always use video calls', 'Scammers use caller ID spoofing to show official numbers', 'They only call on weekdays', 'They send a follow-up email'], correct: 1 },
      { q: 'An automated call says your Absher account will be suspended. Press 1 to prevent it. What should you do?', options: ['Press 1 immediately', 'Hang up and check your Absher account directly', 'Wait for a live agent', 'Press 2 for more information'], correct: 1 },
      { q: 'How should you report a suspicious call in Saudi Arabia?', options: ['Post about it on social media', 'Report it through the Kolluna Amn app or call 911', 'Ignore it', 'Call the number back to investigate'], correct: 1 },
      { q: 'A caller offers you an investment opportunity with guaranteed high returns. This is likely:', options: ['A legitimate investment offer', 'A scam — no investment guarantees high returns', 'An opportunity from the stock exchange', 'A bank-approved offer'], correct: 1 },
      { q: 'If a caller knows your name and some personal details, does that mean they are legitimate?', options: ['Yes, only real organizations have that data', 'No — personal data can be obtained from breaches or social media', 'Yes, if they also know your bank name', 'Only if they call from an 800 number'], correct: 1 },
      { q: 'What is the safest response when you suspect a vishing call?', options: ['Keep talking to gather more information', 'Hang up, verify independently, and report the call', 'Ask the caller to prove their identity', 'Share minimal information to test them'], correct: 1 },
    ],
    ar: [
      { q: 'تلقيت مكالمة من شخص يدعي أنه من وزارة الداخلية ويطلب رقم هويتك وتفاصيل بنكية. ماذا يجب أن تفعل؟', options: ['قدم المعلومات', 'أغلق الخط واتصل بالرقم الرسمي للوزارة', 'اطلب منهم الاتصال لاحقًا', 'شارك رقم هويتك فقط'], correct: 1 },
      { q: 'متصل يقول إنه من بنكك ويحتاج رمز OTP "لمنع الاحتيال." هذا على الأرجح:', options: ['مكالمة حقيقية لمنع الاحتيال', 'احتيال صوتي — البنوك لا تطلب OTP عبر الهاتف', 'تحقق أمني روتيني', 'نظام بنكي آلي'], correct: 1 },
      { q: 'ما هي علامة تحذير أثناء مكالمة هاتفية؟', options: ['المتصل يناديك باسمك', 'المتصل يخلق استعجالاً ويهدد بعواقب', 'المكالمة من رقم محلي', 'المتصل يتحدث العربية'], correct: 1 },
      { q: 'متصل يدعي أن لديك مخالفة مرورية غير مدفوعة ويجب الدفع فورًا أو ستُعتقل. يجب عليك:', options: ['ادفع فورًا لتجنب الاعتقال', 'أغلق الخط — تحقق من المخالفات عبر بوابة أبشر الرسمية', 'اطلب رقم شارته', 'حوّل المال للحساب المعطى'], correct: 1 },
      { q: 'ما الذي يجعل مكالمات الاحتيال الصوتي مقنعة؟', options: ['يستخدمون مكالمات فيديو دائمًا', 'المحتالون يستخدمون انتحال معرف المتصل لإظهار أرقام رسمية', 'يتصلون في أيام العمل فقط', 'يرسلون بريدًا إلكترونيًا متابعًا'], correct: 1 },
      { q: 'مكالمة آلية تقول إن حساب أبشر سيُعلق. اضغط 1 لمنع ذلك. ماذا يجب أن تفعل؟', options: ['اضغط 1 فورًا', 'أغلق الخط وتحقق من حساب أبشر مباشرة', 'انتظر موظفًا', 'اضغط 2 لمزيد من المعلومات'], correct: 1 },
      { q: 'كيف يجب الإبلاغ عن مكالمة مشبوهة في السعودية؟', options: ['انشر عنها في وسائل التواصل', 'أبلغ عبر تطبيق كلنا أمن أو اتصل بـ 911', 'تجاهلها', 'اتصل بالرقم للتحقيق'], correct: 1 },
      { q: 'متصل يعرض فرصة استثمارية بعوائد عالية مضمونة. هذا على الأرجح:', options: ['عرض استثماري حقيقي', 'احتيال — لا يوجد استثمار يضمن عوائد عالية', 'فرصة من سوق الأسهم', 'عرض معتمد من البنك'], correct: 1 },
      { q: 'إذا كان المتصل يعرف اسمك وبعض بياناتك الشخصية، هل هذا يعني أنه شرعي؟', options: ['نعم، فقط المؤسسات الحقيقية تملك هذه البيانات', 'لا — البيانات الشخصية يمكن الحصول عليها من الاختراقات أو وسائل التواصل', 'نعم، إذا كان يعرف اسم بنكك أيضًا', 'فقط إذا اتصل من رقم 800'], correct: 1 },
      { q: 'ما هو الرد الأكثر أمانًا عندما تشك في مكالمة احتيالية؟', options: ['واصل الحديث لجمع معلومات', 'أغلق الخط، تحقق بشكل مستقل، وأبلغ عن المكالمة', 'اطلب من المتصل إثبات هويته', 'شارك معلومات قليلة لاختبارهم'], correct: 1 },
    ],
  },
};

function PublicQuiz() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const isRTL = i18n.language === 'ar';
  const lang = i18n.language === 'ar' ? 'ar' : 'en';

  const [selectedTopic, setSelectedTopic] = useState(searchParams.get('topic') || null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState([]);

  const quizTopics = [
    {
      id: 'phishing',
      icon: Mail,
      title: t('public.quiz.phishingQuiz'),
      color: 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg dark:hover:shadow-gray-900/50',
      iconColor: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
      activeColor: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    },
    {
      id: 'smishing',
      icon: Smartphone,
      title: t('public.quiz.smishingQuiz'),
      color: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg dark:hover:shadow-gray-900/50',
      iconColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
      activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      id: 'vishing',
      icon: Phone,
      title: t('public.quiz.vishingQuiz'),
      color: 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-lg dark:hover:shadow-gray-900/50',
      iconColor: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400',
      activeColor: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  const questions = selectedTopic ? quizData[selectedTopic]?.[lang] || [] : [];
  const currentQ = questions[currentQuestion];

  const handleAnswer = (index) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    const isCorrect = index === currentQ.correct;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((a) => [...a, { question: currentQuestion, selected: index, correct: currentQ.correct, isCorrect }]);
  };

  const handleNext = () => {
    if (currentQuestion + 1 >= questions.length) {
      setQuizComplete(true);
    } else {
      setCurrentQuestion((q) => q + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers([]);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    handleRestart();
  };

  // Topic Selection Screen
  if (!selectedTopic) {
    return (
      <div className="fade-in">
        <section className="bg-gradient-to-br from-primary-700 to-primary-900 dark:from-primary-900 dark:to-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Shield className="h-5 w-5 text-blue-300" />
              <span className="text-sm text-blue-100">{t('public.hero.badge')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('public.quiz.title')}
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              {t('public.quiz.subtitle')}
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {quizTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`w-full card border-2 ${topic.color} transition-all duration-200 text-left`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${topic.iconColor}`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{topic.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            10 {t('public.quiz.questions')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            10 {t('public.quiz.minutes')}
                          </span>
                          <span className="inline-block text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                            {t('public.quiz.beginner')}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className={`h-5 w-5 text-gray-400 dark:text-gray-500 ${isRTL ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Quiz Complete Screen
  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="fade-in py-16 bg-gray-50 dark:bg-gray-900 min-h-[80vh]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center p-8">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${passed ? 'bg-success-50 dark:bg-success-900/20' : 'bg-warning-50 dark:bg-warning-900/20'}`}>
              <Trophy className={`h-10 w-10 ${passed ? 'text-success-600' : 'text-warning-500'}`} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {passed
                ? (i18n.language === 'ar' ? 'أحسنت!' : 'Great Job!')
                : (i18n.language === 'ar' ? 'حاول مرة أخرى!' : 'Keep Learning!')
              }
            </h2>

            <div className="text-5xl font-bold text-primary-600 my-4">
              {percentage}%
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {score} / {questions.length} {i18n.language === 'ar' ? 'إجابات صحيحة' : 'correct answers'}
            </p>

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
              {passed
                ? (i18n.language === 'ar' ? 'لديك وعي جيد بالتهديدات السيبرانية!' : 'You have good awareness of cyber threats!')
                : (i18n.language === 'ar' ? 'راجع مواد التدريب وحاول مرة أخرى' : 'Review the training materials and try again')
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="btn-outline inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {i18n.language === 'ar' ? 'أعد الاختبار' : 'Retake Quiz'}
              </button>
              <button
                onClick={handleBackToTopics}
                className="btn-secondary inline-flex items-center justify-center"
              >
                {i18n.language === 'ar' ? 'اختبارات أخرى' : 'Other Quizzes'}
              </button>
              <Link
                to={`/training/${selectedTopic}`}
                className="btn-primary inline-flex items-center justify-center"
              >
                {i18n.language === 'ar' ? 'راجع التدريب' : 'Review Training'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Question Screen
  return (
    <div className="fade-in py-8 sm:py-16 bg-gray-50 dark:bg-gray-900 min-h-[80vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleBackToTopics}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors"
            >
              {i18n.language === 'ar' ? 'العودة للاختبارات' : 'Back to quizzes'}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6 leading-relaxed">
            {currentQ.q}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((option, index) => {
              let buttonClass = 'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ';

              if (!showResult) {
                buttonClass += selectedAnswer === index
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
              } else if (index === currentQ.correct) {
                buttonClass += 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20';
              } else if (index === selectedAnswer && index !== currentQ.correct) {
                buttonClass += 'border-danger-500 bg-danger-50';
              } else {
                buttonClass += 'border-gray-200 dark:border-gray-700 opacity-60';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {showResult && index === currentQ.correct ? (
                        <CheckCircle className="h-5 w-5 text-success-600" />
                      ) : showResult && index === selectedAnswer && index !== currentQ.correct ? (
                        <XCircle className="h-5 w-5 text-danger-500" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          selectedAnswer === index ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedAnswer === index && !showResult && (
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 scale-50" />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-800 dark:text-gray-100">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Next button */}
          {showResult && (
            <div className="mt-6 flex justify-end">
              <button onClick={handleNext} className="btn-primary">
                {currentQuestion + 1 >= questions.length
                  ? (i18n.language === 'ar' ? 'عرض النتائج' : 'View Results')
                  : t('common.next')
                }
                <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicQuiz;
