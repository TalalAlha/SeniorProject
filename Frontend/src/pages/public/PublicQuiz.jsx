/**
 * PublicQuiz — Guest-accessible phishing awareness quiz (/quiz).
 *
 * Lets unauthenticated or PUBLIC_USER visitors test their phishing detection skills.
 * Uses URL search params (?lang=en|ar) to switch between English and Arabic modes.
 */
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
  "phishing": {
    "en": [
      {
        "q": "You receive an email from \"nafath@verify-sa.com\" asking you to click a link to update your identity. What should you do?",
        "options": [
          "Reply to the email with your ID number to confirm.",
          "Ignore the email; Nafath never asks for updates via links.",
          "Click the link to verify your identity immediately.",
          "Forward the email to your bank to verify."
        ],
        "correct": 1
      },
      {
        "q": "An email appearing to be from \"Absher\" says you have an unpaid traffic fine and provides a payment link. What is the safest action?",
        "options": [
          "Log into the official Absher app directly to check for fines.",
          "Pay it immediately to avoid your services being frozen.",
          "Check if the email has the Ministry of Interior logo, then pay.",
          "Click the link to see the picture of the traffic violation."
        ],
        "correct": 0
      },
      {
        "q": "HR sends an email to all employees: \"Urgent: Update your payroll details via this link or your salary will be suspended.\" What is this?",
        "options": [
          "A standard end-of-year HR procedure.",
          "A phishing attempt trying to steal your credentials.",
          "A secure way to update banking information.",
          "A system error from the finance department."
        ],
        "correct": 1
      },
      {
        "q": "Your CEO sends a brief email: \"Are you at your desk? I need you to buy 5 iTunes gift cards for a client urgently. Don't call me, I'm in a meeting.\" What do you do?",
        "options": [
          "Call the CEO or speak to them in person to verify the request.",
          "Buy the gift cards immediately to impress the CEO.",
          "Forward it to Finance to purchase the cards.",
          "Reply to the email asking what denomination the cards should be."
        ],
        "correct": 0
      },
      {
        "q": "ZATCA (Tax Authority) emails you an \"Overdue Invoice\" as a PDF attachment. You weren't expecting any invoices. Should you open it?",
        "options": [
          "Yes, PDFs are always safe to open.",
          "Only if the email was sent during normal business hours.",
          "Yes, it might be a tax bill you forgot about.",
          "No, opening unexpected attachments can install malware."
        ],
        "correct": 3
      },
      {
        "q": "A bank email warns your account is frozen and you must click to unfreeze it. Why is this suspicious?",
        "options": [
          "The email doesn't use a colorful font.",
          "The email does not include your account balance.",
          "Banks do not send unfreeze links via email.",
          "It was sent to your personal email instead of your work email."
        ],
        "correct": 2
      },
      {
        "q": "A long-time supplier emails you suddenly stating their bank account (IBAN) has changed for all future payments. What is the mandatory next step?",
        "options": [
          "Update the ERP system immediately to avoid delayed payments.",
          "Call the supplier on a known, trusted phone number to verify.",
          "Reply to the email asking for a signed letter.",
          "Pay the next invoice to the new account to test it."
        ],
        "correct": 1
      },
      {
        "q": "IT Support sends an email asking for your password to upgrade your email storage. What should you do?",
        "options": [
          "Ignore it until they call you on the phone.",
          "Send the password so you don't lose your emails.",
          "Send a fake password to see what happens.",
          "Report the email to security; IT never asks for your password."
        ],
        "correct": 3
      },
      {
        "q": "You get an email from \"Saudi Post (SPL)\" with a tracking link for a package you didn't order. What should you do?",
        "options": [
          "Delete the email without clicking the link.",
          "Enter your credit card to pay the small delivery fee.",
          "Reply and ask who sent the package.",
          "Click the link to see if someone sent you a gift."
        ],
        "correct": 0
      },
      {
        "q": "What is the best way to verify if a link in an email is safe before clicking?",
        "options": [
          "Check if the email has a professional signature.",
          "Hover over the link to see the actual URL destination.",
          "Look for the padlock icon in the email header.",
          "Read the email text to see if it sounds professional."
        ],
        "correct": 1
      }
    ],
    "ar": [
      {
        "q": "وصلك إيميل من \"nafath@verify-sa.com\" يطلب منك تضغط رابط لتحديث بياناتك. وش بتسوي؟",
        "options": [
          "أطنش الإيميل لأن نفاذ ما ترسل روابط تحديث أبداً.",
          "أحول الإيميل للبنك عشان يتأكدون منه.",
          "أرد عليهم برقم هويتي عشان يتأكدون.",
          "أضغط الرابط وأحدث بياناتي بسرعة."
        ],
        "correct": 0
      },
      {
        "q": "جاك إيميل كأنه من \"أبشر\" يقول عليك مخالفة مرورية ولازم تسددها من الرابط. وش أأمن تصرف؟",
        "options": [
          "أسددها فوراً عشان ما تتوقف خدماتي.",
          "أفتح تطبيق أبشر الرسمي بنفسي وأشيك على المخالفات.",
          "أتأكد إذا الإيميل فيه شعار وزارة الداخلية وأسدد.",
          "أضغط الرابط عشان أشوف صورة المخالفة."
        ],
        "correct": 1
      },
      {
        "q": "الموارد البشرية أرسلوا إيميل: \"عاجل: حدث بيانات راتبك عبر الرابط وإلا سيتم إيقاف راتبك.\" وش تتوقع هذا؟",
        "options": [
          "إجراء روتيني من الموارد البشرية نهاية السنة.",
          "محاولة تصيد (Phishing) لسرقة بيانات الدخول حقتي.",
          "غلطة بالنظام من قسم المالية.",
          "طريقة آمنة لتحديث الآيبان البنكي."
        ],
        "correct": 1
      },
      {
        "q": "المدير أرسل لك إيميل: \"أنا باجتماع لا تدق علي، اشتر 5 بطاقات آيتونز لعميل ضروري.\" وش تسوي؟",
        "options": [
          "أشتري البطاقات فوراً عشان أبيض الوجه مع المدير.",
          "أتصل بالمدير أو أكلمه شخصياً عشان أتأكد من الطلب.",
          "أرد على الإيميل أسأله كم فئة البطاقات اللي يبيها.",
          "أحول الإيميل للمالية عشان يشترونها."
        ],
        "correct": 1
      },
      {
        "q": "هيئة الزكاة (ZATCA) أرسلت لك فاتورة متأخرة بصيغة PDF وأنت ما تتوقع أي فواتير. تفتح الملف؟",
        "options": [
          "أفتحه بس إذا كان مرسل وقت الدوام الرسمي.",
          "إيه، يمكن فاتورة ضريبية نسيتها.",
          "إيه، ملفات الـ PDF دايم آمنة.",
          "لا، لأن فتح المرفقات المجهولة ممكن يثبت فايروس بجهازي."
        ],
        "correct": 3
      },
      {
        "q": "إيميل من البنك يقول حسابك مجمد واضغط الرابط عشان تفكه. ليش هالإيميل مشبوه؟",
        "options": [
          "لأن البنوك ما ترسل روابط لفك تجميد الحسابات.",
          "لأن الإيميل ما استخدم خطوط وألوان رسمية.",
          "لأن الإيميل ما ذكر كم رصيدي.",
          "لأنه وصلني على إيميلي الشخصي مو إيميل الدوام."
        ],
        "correct": 0
      },
      {
        "q": "مورد تتعامل معه أرسل إيميل فجأة يقول إن رقم حسابهم (الآيبان) تغير للدفعات الجاية. وش الخطوة الإلزامية؟",
        "options": [
          "أحول الدفعة الجاية للحساب الجديد عشان أجربه.",
          "أرد على الإيميل أطلب خطاب موقع ومختوم.",
          "أتصل بالمورد على رقمه المعتمد عندنا وأتأكد منه شخصياً.",
          "أحدث نظام الدفع فوراً عشان ما تتأخر الدفعات."
        ],
        "correct": 2
      },
      {
        "q": "الدعم الفني (IT) طلب باسوردك بالإيميل عشان يرفع مساحة التخزين عندك. وش تسوي؟",
        "options": [
          "أطنش الإيميل لين يدقون علي بالتليفون.",
          "أعطيهم باسورد غلط أشوف وش يصير.",
          "أرسل الباسورد عشان ما تنحذف إيميلاتي.",
          "أبلغ عن الإيميل، لأن الـ IT مستحيل يطلبون الباسورد."
        ],
        "correct": 3
      },
      {
        "q": "جاك إيميل من \"البريد السعودي (سبل)\" فيه رابط تتبع لشحنة أنت أصلاً ما طلبتها. وش السواة؟",
        "options": [
          "أضغط الرابط يمكن أحد مرسل لي هدية مفاجئة.",
          "أحذف الإيميل ولا أضغط الرابط أبداً.",
          "أرد على الإيميل أسألهم مين المرسل.",
          "أدخل بطاقتي وأدفع رسوم التوصيل البسيطة."
        ],
        "correct": 1
      },
      {
        "q": "وش أحسن طريقة تتأكد فيها من الرابط اللي بالإيميل قبل لا تضغطه؟",
        "options": [
          "أدور على علامة القفل الأخضر في الإيميل.",
          "أمرر الماوس فوق الرابط عشان أشوف وين بيوديني صدق.",
          "أقرأ الإيميل زين وأشوف إذا لغته رسمية ومحترمة.",
          "أشيك على التوقيع الرسمي آخر الإيميل."
        ],
        "correct": 1
      }
    ]
  },
  "smishing": {
    "en": [
      {
        "q": "You receive an SMS with a Nafath OTP code, but you are not trying to log into any government service. What does this mean?",
        "options": [
          "Someone has your password and is attempting to access your account.",
          "Your phone network is delayed and sent an old message.",
          "Your phone is infected with a virus.",
          "It is a routine system check by Nafath."
        ],
        "correct": 0
      },
      {
        "q": "An SMS from \"SPL\" says your package is held at customs and you must pay 10 SAR via a link. What should you do?",
        "options": [
          "Pay the 10 SAR; it's a small amount anyway.",
          "Reply to the SMS asking for the tracking number.",
          "Ignore it. This is a common scam to steal your credit card details.",
          "Click the link just to see what the package is."
        ],
        "correct": 2
      },
      {
        "q": "You receive a text: \"Congratulations! You won 100,000 SAR from STC. Click here to claim your prize.\" How should you react?",
        "options": [
          "Call the number that sent the SMS to thank them.",
          "Delete the message. Real prizes do not require clicking unverified links.",
          "Click the link to claim the prize quickly.",
          "Forward the message to your family so they can win too."
        ],
        "correct": 1
      },
      {
        "q": "Your bank sends an SMS saying your ATM card is blocked due to suspicious activity, with a link to verify your identity. You should:",
        "options": [
          "Reply with your ID number to confirm your identity.",
          "Click the link immediately to unblock your card.",
          "Log into your official banking app or call the bank directly to check.",
          "Send your CVV number to the sender."
        ],
        "correct": 2
      },
      {
        "q": "Why are shortened links (like bit.ly) dangerous when sent by unknown numbers in an SMS?",
        "options": [
          "They hide the real, often malicious, destination URL from you.",
          "They cost money to click on.",
          "They make your phone run slower.",
          "They automatically delete your contacts."
        ],
        "correct": 0
      },
      {
        "q": "An SMS claiming to be from the \"Ministry of Interior\" includes a link to pay a traffic violation. What is the main red flag?",
        "options": [
          "The government does not send payment links via SMS.",
          "The SMS does not have a picture of the violation.",
          "The SMS was sent in the afternoon.",
          "The message is written in English instead of Arabic."
        ],
        "correct": 0
      },
      {
        "q": "You receive an SMS on your personal phone claiming your work salary is suspended and you must update your details via a link.",
        "options": [
          "Click the link and update your details to get paid.",
          "Forward the SMS to your manager for approval.",
          "Report it to your IT department; HR does not use SMS for payroll updates.",
          "Reply to the SMS with your employee ID."
        ],
        "correct": 2
      },
      {
        "q": "An SMS on your personal phone says your company's Office 365 subscription is expiring. Why is this suspicious?",
        "options": [
          "Microsoft always calls you instead of sending an SMS.",
          "The SMS did not include the Microsoft logo.",
          "Office 365 is completely free for companies.",
          "Corporate IT alerts are not sent to personal phone numbers via SMS."
        ],
        "correct": 3
      },
      {
        "q": "A text message asks you to download the \"urgent company VPN update\" via a link. What should you do?",
        "options": [
          "Download it only if you are connected to the company Wi-Fi.",
          "Do not click. Contact IT directly, as updates come from official portals.",
          "Download it immediately so you don't lose access to the network.",
          "Share the link with your coworkers so they can update too."
        ],
        "correct": 1
      },
      {
        "q": "What is the \"Golden Rule\" for dealing with unexpected work-related SMS messages containing links?",
        "options": [
          "Click the link but do not enter any passwords.",
          "SMS + Link + Urgent Action = Highly Suspicious. Do not click.",
          "Always trust messages if they mention your company's name.",
          "If the SMS is from a local number, it is safe to click."
        ],
        "correct": 1
      }
    ],
    "ar": [
      {
        "q": "وصلك كود تفعيل من نفاذ على جوالك وأنت جالس ما سويت شي ولا حاولت تدخل أي تطبيق. وش معناه؟",
        "options": [
          "الشبكة معلقة وهذي رسالة قديمة توها توصل.",
          "فيه شخص يعرف رقمك السري ويحاول يدخل حسابك، لازم تغيره.",
          "جوالك فيه فايروس يرسل رسايل من نفسه.",
          "هذا فحص أمني روتيني من نظام نفاذ."
        ],
        "correct": 1
      },
      {
        "q": "رسالة من \"البريد السعودي سبل\" تقول شحنتك محجوزة ولازم تدفع 10 ريال رسوم تخليص عبر الرابط. وش تسوي؟",
        "options": [
          "أضغط الرابط بس عشان أشوف وش الشحنة.",
          "أدفع الـ 10 ريال، مبلغ بسيط ما يضر.",
          "أتجاهلها، هذا نصب مشهور هدفهم يسرقون معلومات بطاقتك وتنسحب كل فلوسك.",
          "أرد على الرسالة وأطلب رقم التتبع."
        ],
        "correct": 2
      },
      {
        "q": "جتك رسالة: \"مبروك! ربحت 100 ألف ريال من STC، اضغط الرابط لاستلام الجائزة\". وش أحسن تصرف؟",
        "options": [
          "أضغط الرابط بسرعة عشان أستلم الجائزة.",
          "أدق على الرقم اللي أرسل الرسالة عشان أشكره.",
          "أرسلها لأهلي عشان يربحون معي.",
          "أحذف الرسالة، الجوائز الصدقية ما تطلب تضغط روابط مجهولة."
        ],
        "correct": 3
      },
      {
        "q": "البنك أرسل لك رسالة إن بطاقتك توقفت بسبب نشاط مشبوه، وحط لك رابط لتأكيد هويتك. وش السواة؟",
        "options": [
          "أضغط الرابط فوراً عشان تتفعل بطاقتي.",
          "أدخل تطبيق البنك الرسمي أو أدق عليهم أتأكد، ولا أضغط الرابط.",
          "أرد عليهم برقم هويتي عشان يتأكدون.",
          "أرسل لهم رقم الـ CVV عشان يطابقونه."
        ],
        "correct": 1
      },
      {
        "q": "ليش الروابط المختصرة (زي bit.ly) تعتبر خطيرة إذا جتك برسالة SMS من رقم ما تعرفه؟",
        "options": [
          "لأنها تخلي جوالك يعلق ويصير بطيء.",
          "لأنها تخفي الرابط الحقيقي للموقع الوهمي أو الخبيث عن عينك.",
          "لأنها تحذف جهات الاتصال اللي بجوالك تلقائياً.",
          "لأن الضغط عليها يخصم من رصيد جوالك."
        ],
        "correct": 1
      },
      {
        "q": "رسالة تدعي إنها من \"وزارة الداخلية\" فيها رابط لتسديد مخالفة مرورية. وش أكبر علامة إنها كذبة؟",
        "options": [
          "الجهات الحكومية ما ترسل روابط تسديد مخالفات عبر الـ SMS.",
          "إن الرسالة ما فيها صورة سيارتك وهي مخالفة.",
          "إن الرسالة مكتوبة بخط غير رسمي.",
          "إن الرسالة وصلت العصر مو الصبح."
        ],
        "correct": 0
      },
      {
        "q": "وصلتك رسالة على جوالك الخاص تقول \"تم إيقاف راتبك، حدث بياناتك عبر الرابط\".",
        "options": [
          "أضغط الرابط وأحدث بياناتي عشان ينزل الراتب.",
          "أبلغ أمن المعلومات (IT)، لأن الـ HR ما يطلبون تحديث الراتب برابط SMS.",
          "أرد على الرسالة برقمي الوظيفي.",
          "أحول الرسالة لمديري المباشر يعتمدها."
        ],
        "correct": 1
      },
      {
        "q": "رسالة على جوالك الشخصي تقول \"اشتراك أوفيس 365 للشركة بينتهي\". ليش هالرسالة مشبوهة؟",
        "options": [
          "لأن تنبيهات الـ IT للشركة ما توصل على جوالك الشخصي عبر SMS.",
          "لأن مايكروسوفت دايم تدق عليك ما ترسل رسائل.",
          "لأن أوفيس 365 مجاني تماماً للشركات.",
          "لأن الرسالة ما فيها شعار مايكروسوفت."
        ],
        "correct": 0
      },
      {
        "q": "رسالة فيها رابط تقول لك \"نزل التحديث الجديد والضروري لـ VPN الشركة\". وش بتسوي؟",
        "options": [
          "أحمله فوراً عشان ما ينقطع عني اتصال الشركة.",
          "ما أضغط الرابط، التحديثات تنزل من بوابات الشركة الرسمية وأكلم الـ IT.",
          "أحمله بس إذا كنت شابك على واي فاي الشركة بالدوام.",
          "أرسل الرابط لزملائي بالقروب عشان يحدثون معي."
        ],
        "correct": 1
      },
      {
        "q": "وش \"القاعدة الذهبية\" للتعامل مع أي رسالة SMS تخص الشغل وفيها رابط مجهول؟",
        "options": [
          "رسالة + رابط + إجراء عاجل = احتيال بنسبة كبيرة. لا تضغط الرابط.",
          "أضغط الرابط بس أهم شي ما أكتب رقمي السري.",
          "أثق بالرسالة إذا كانت مكتوبة بلغة عربية فصحى.",
          "إذا كانت الرسالة من رقم سعودي محلي فهي آمنة."
        ],
        "correct": 0
      }
    ]
  },
  "vishing": {
    "en": [
      {
        "q": "You receive a phone call from someone claiming to be from the \"Ministry of Interior\" saying your services will be frozen unless you pay a fine. What should you do?",
        "options": [
          "Ask them to send you a payment link on WhatsApp.",
          "Hang up and check your Absher account independently.",
          "Pay the fine over the phone using your credit card.",
          "Argue with the caller to prove they are fake."
        ],
        "correct": 1
      },
      {
        "q": "A caller claiming to be from SAMA (Central Bank) asks for the OTP code you just received to \"secure your compromised account\". Is this normal?",
        "options": [
          "Maybe, give them the OTP but check your account later.",
          "Yes, but only if they correctly verify your national ID first.",
          "No, SAMA and banks will NEVER ask for your OTP over the phone.",
          "Yes, SAMA monitors fraud and calls citizens directly."
        ],
        "correct": 2
      },
      {
        "q": "A \"bank investigator\" calls about a suspicious charge and needs your card's CVV to cancel it immediately.",
        "options": [
          "Give them the CVV so they can stop the fraudsters.",
          "Hang up. Banks do not need your CVV to cancel a transaction.",
          "Give them a fake CVV to test if they are real.",
          "Ask them to read back your recent transactions first."
        ],
        "correct": 1
      },
      {
        "q": "How is it possible for a scammer's call to show your actual bank's phone number on your Caller ID?",
        "options": [
          "They use Caller ID Spoofing software to fake the number.",
          "They have hacked the telecom company's main server.",
          "They are actually calling from inside the bank.",
          "Telecom companies sell official numbers to scammers."
        ],
        "correct": 0
      },
      {
        "q": "A vendor calls you sounding extremely angry, demanding you immediately change their IBAN and wire a payment. What should you do?",
        "options": [
          "Change the IBAN and wire the money to calm them down.",
          "Tell them you must follow the official callback and verification procedure.",
          "Transfer a small amount first to test the new account.",
          "Ask a coworker to quickly approve the change."
        ],
        "correct": 1
      },
      {
        "q": "Someone calls claiming to be from your company's IT department, asking for your password to fix a virus on your PC.",
        "options": [
          "Ask them for their employee ID before giving the password.",
          "Give it to them so they can remove the virus quickly.",
          "Refuse and hang up. IT never needs your personal password.",
          "Give them the password but change it right after the call."
        ],
        "correct": 2
      },
      {
        "q": "You get a call from \"Microsoft Support\" stating your work laptop is infected and they need remote access.",
        "options": [
          "Ask them for a support ticket number.",
          "Hang up and contact your internal IT department. Microsoft doesn't call end-users.",
          "Tell them to fix it without accessing your screen.",
          "Grant them access; Microsoft is a trusted company."
        ],
        "correct": 1
      },
      {
        "q": "A caller claims to be a Senior Executive you have never met, asking for sensitive financial data immediately.",
        "options": [
          "Provide the data; you don't want to upset senior management.",
          "Politely hang up and verify their identity through the internal company directory.",
          "Ask them technical questions to prove they work at the company.",
          "Email the data to their personal email address as requested."
        ],
        "correct": 1
      },
      {
        "q": "Why do vishing scammers try to make you feel panicked or rushed during the phone call?",
        "options": [
          "Because their VoIP calling credits are running out.",
          "Because banking systems close at a certain time.",
          "They want to show how important the security issue is.",
          "Fear shuts down critical thinking and makes you skip verification steps."
        ],
        "correct": 3
      },
      {
        "q": "What is the absolute best response if you receive a suspicious call from someone claiming to be your bank?",
        "options": [
          "Give them partial information to see if they know the rest.",
          "Stay on the line and ask trick questions to catch them in a lie.",
          "Record the call and share it on social media.",
          "Hang up, find the official number on your bank card, and call the bank yourself."
        ],
        "correct": 3
      }
    ],
    "ar": [
      {
        "q": "دق عليك واحد يقول إنه من \"وزارة الداخلية\" وعليك إيقاف خدمات إذا ما سددت المخالفة الحين. وش بتسوي؟",
        "options": [
          "أقول له يرسل لي رابط السداد على الواتساب.",
          "أقفل الخط وأدخل حسابي في أبشر أتأكد بنفسي.",
          "أسدد المخالفة بالبطاقة وأنا على الخط معه.",
          "أهاوشه وأحاول أثبت له إنه نصاب."
        ],
        "correct": 1
      },
      {
        "q": "متصل يدعي إنه من \"مؤسسة النقد (البنك المركزي)\" ويطلب منك كود التفعيل (OTP) عشان يحمي حسابك المخترق. طبيعي؟",
        "options": [
          "إيه، مؤسسة النقد تراقب الاحتيال وتدق على المواطنين.",
          "لا، مؤسسة النقد والبنوك مستحيل يطلبون الكود بالتليفون.",
          "إيه، بس بشرط إنه يعلمني برقم هويتي أول.",
          "يمكن، أعطيه الكود وأشيك على حسابي بعدين."
        ],
        "correct": 1
      },
      {
        "q": "\"محقق من البنك\" يدق يقول فيه عملية مشبوهة ويبي رقم الـ CVV اللي ورا البطاقة عشان يلغيها فوراً.",
        "options": [
          "أطلب منه يقرأ لي آخر عملياتي البنكية أول.",
          "أقفل الخط. البنك ما يحتاج الـ CVV عشان يلغي أي عملية.",
          "أعطيه CVV غلط عشان أختبره إذا هو صادق.",
          "أعطيه الـ CVV عشان يوقف الحرامية بسرعة."
        ],
        "correct": 1
      },
      {
        "q": "كيف يقدر المحتال يخلي رقمه يظهر بشاشة جوالك وكأنه رقم البنك الرسمي؟",
        "options": [
          "يستخدم برامج تزوير الأرقام (Spoofing) عشان يقلد الرقم.",
          "لأنه قدر يهكر السيرفر الرئيسي لشركة الاتصالات.",
          "لأنه فعلاً يكلمك من داخل مبنى البنك.",
          "شركات الاتصالات تبيع الأرقام الرسمية للمحتالين."
        ],
        "correct": 0
      },
      {
        "q": "مورد تتعاملون معه اتصل وهو معصب جداً، ويطالب بتغيير حساب الدفع (الآيبان) وتحويل الفلوس فوراً. وش تسوي؟",
        "options": [
          "أحول له مبلغ بسيط أول عشان أجرب الحساب الجديد.",
          "أبلغه إني لازم أتبع سياسة الشركة الرسمية بإعادة الاتصال والتحقق.",
          "أخلي زميلي يوافق على التغيير بسرعة عشان نخلص.",
          "أغير الآيبان وأحول الفلوس عشان أهديه ونحفظ العقد."
        ],
        "correct": 1
      },
      {
        "q": "شخص دق عليك وقال إنه من الدعم الفني (IT) حق الشركة، ويبي باسورد جهازك عشان يمسح فايروس.",
        "options": [
          "أعطيه الباسورد بس أغيره أول ما تنتهي المكالمة.",
          "أطلب منه رقمه الوظيفي قبل ما أعطيه الباسورد.",
          "أعطيه الباسورد عشان يمسح الفايروس بسرعة.",
          "أرفض وأقفل الخط. الـ IT مستحيل يطلب الباسورد الشخصي."
        ],
        "correct": 3
      },
      {
        "q": "اتصلت عليك شركة \"مايكروسوفت\" تقول إن لابتوب الدوام حقك مخترق ويحتاجون يدخلون عليه عن بُعد.",
        "options": [
          "أعطيهم صلاحية الدخول، مايكروسوفت شركة معروفة وموثوقة.",
          "أطلب منهم رقم تذكرة الدعم الفني الخاصة فيني.",
          "أقفل الخط وأكلم الـ IT حق شركتنا. مايكروسوفت ما تدق على المستخدمين مباشرة.",
          "أقول لهم صلحوه بس بدون ما تشوفون شاشتي."
        ],
        "correct": 2
      },
      {
        "q": "متصل يدعي إنه من \"الإدارة العليا\" (مدير كبير ما قد قابلته) ويطلب منك معلومات مالية سرية فوراً.",
        "options": [
          "أرسل المعلومات اللي طلبها لإيميله الشخصي.",
          "أعطيه المعلومات، مابي أزعل الإدارة العليا وأورط نفسي.",
          "أسأله أسئلة تقنية وتفصيلية عشان أختبر إذا هو صدق بالشركة.",
          "أعتذر بلباقة، وأقفل الخط وأتأكد من هويته عن طريق دليل الشركة الداخلي."
        ],
        "correct": 3
      },
      {
        "q": "ليش المحتال (في المكالمات) دايم يحاول يخليك تستعجل وتخاف وترتبك؟",
        "options": [
          "لأن أنظمة البنوك تقفل في وقت معين ولازم يلحق.",
          "لأن رصيد الاتصال حقه (VoIP) بيخلص ويبي يقفل.",
          "عشان يوريك إن المشكلة الأمنية فعلاً خطيرة ومهمة.",
          "لأن الخوف يعطل التفكير المنطقي ويخليك تتجاوز خطوات التحقق."
        ],
        "correct": 3
      },
      {
        "q": "وش أفضل تصرف لو دق عليك رقم يدعي إنه بنكك وشكيت فيه؟",
        "options": [
          "أعطيه معلومات ناقصة وأشوف إذا بيعرف الباقي.",
          "أبقى على الخط وأسأله أسئلة فخ عشان أصيده وهو يكذب.",
          "أقفل الخط، وأطلع رقم البنك من ظهر بطاقة الصرافة وأدق عليهم أنا.",
          "أسجل المكالمة وأنشرها بتويتر وتيك توك عشان أحذر الناس."
        ],
        "correct": 2
      }
    ]
  }
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
                ? t('public.quiz.greatJob')
                : t('public.quiz.keepLearning')
              }
            </h2>

            <div className="text-5xl font-bold text-primary-600 my-4">
              {percentage}%
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {score} / {questions.length} {t('public.quiz.correctAnswers')}
            </p>

            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
              {passed ? t('public.quiz.passedMessage') : t('public.quiz.failedMessage')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="btn-outline inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {t('public.quiz.retake')}
              </button>
              <button
                onClick={handleBackToTopics}
                className="btn-secondary inline-flex items-center justify-center"
              >
                {t('public.quiz.otherAssessments')}
              </button>
              <Link
                to={`/training/${selectedTopic}`}
                className="btn-primary inline-flex items-center justify-center"
              >
                {t('public.quiz.reviewTraining')}
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
              {t('public.quiz.backToList')}
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
                  ? t('public.quiz.viewResults')
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
