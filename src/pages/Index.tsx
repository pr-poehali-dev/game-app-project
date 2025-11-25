import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

type GameState = 'menu' | 'playing' | 'leaderboard' | 'profile' | 'shop';

interface PlayerData {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  score: number;
  clicks: number;
  storyProgress: number;
  endings: string[];
}

interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
}

interface StoryNode {
  id: number;
  title: string;
  text: string;
  choices: {
    text: string;
    nextId: number;
    xp: number;
    score: number;
    consequence?: string;
  }[];
  isEnding?: boolean;
  endingType?: 'good' | 'bad' | 'neutral';
}

const storyNodes: StoryNode[] = [
  {
    id: 0,
    title: "Пробуждение",
    text: "Ты просыпаешься в неоновом городе будущего. Голографический экран сообщает: 'Система обнаружила аномалию. Выбери путь'.",
    choices: [
      { text: "🔍 Исследовать аномалию", nextId: 1, xp: 50, score: 100, consequence: "Ты выбрал путь исследователя" },
      { text: "⚔️ Игнорировать и идти в бой", nextId: 2, xp: 30, score: 80, consequence: "Ты выбрал путь воина" },
      { text: "🤝 Найти союзников", nextId: 3, xp: 40, score: 120, consequence: "Ты выбрал путь дипломата" }
    ]
  },
  {
    id: 1,
    title: "Исследование",
    text: "Аномалия ведет к заброшенной лаборатории. На столе лежит странное устройство с кнопкой. Что делать?",
    choices: [
      { text: "🔴 Нажать кнопку", nextId: 4, xp: 80, score: 200, consequence: "Активировано древнее устройство!" },
      { text: "📱 Сканировать устройство", nextId: 5, xp: 100, score: 250, consequence: "Обнаружены чертежи технологии" },
      { text: "🚪 Покинуть лабораторию", nextId: 6, xp: 20, score: 50, consequence: "Ты вернулся в город" }
    ]
  },
  {
    id: 2,
    title: "Арена",
    text: "Ты попадаешь на киберспортивную арену. Толпа ждет твоего выступления. Выбери стратегию боя.",
    choices: [
      { text: "⚡ Агрессивная атака", nextId: 7, xp: 60, score: 180, consequence: "Быстрая победа!" },
      { text: "🛡️ Защитная тактика", nextId: 8, xp: 70, score: 150, consequence: "Враг устал атаковать" },
      { text: "🎯 Тактический подход", nextId: 9, xp: 90, score: 220, consequence: "Идеальная стратегия!" }
    ]
  },
  {
    id: 3,
    title: "Альянс",
    text: "Ты встречаешь группу хакеров. Их лидер предлагает сделку: помочь взломать корпорацию.",
    choices: [
      { text: "✅ Принять предложение", nextId: 10, xp: 100, score: 300, consequence: "Альянс заключен!" },
      { text: "❌ Отказаться", nextId: 11, xp: 40, score: 100, consequence: "Ты остался один" },
      { text: "💰 Потребовать плату", nextId: 12, xp: 120, score: 350, consequence: "Выгодная сделка!" }
    ]
  },
  {
    id: 4,
    title: "Активация",
    text: "Устройство создает портал в цифровое измерение. Ты видишь код самой реальности. Это шанс изменить всё!",
    choices: [
      { text: "🌟 Войти в портал", nextId: 13, xp: 200, score: 500, consequence: "Ты стал цифровым богом!" },
      { text: "💾 Скопировать код", nextId: 14, xp: 150, score: 400, consequence: "Знание - сила!" }
    ]
  },
  {
    id: 5,
    title: "Открытие",
    text: "Сканирование раскрывает тайну: это устройство может материализовать мысли. Невероятная сила в твоих руках!",
    choices: [
      { text: "🎨 Создать новый мир", nextId: 15, xp: 180, score: 450, consequence: "Ты создатель новой реальности!" },
      { text: "🔧 Улучшить технологию", nextId: 16, xp: 160, score: 420, consequence: "Технология доведена до совершенства!" }
    ]
  },
  {
    id: 6,
    title: "Возвращение",
    text: "Город встречает тебя тревожными сиренами. Началась кибер-атака! Нужно действовать быстро.",
    choices: [
      { text: "🚨 Защищать город", nextId: 17, xp: 100, score: 280, consequence: "Ты герой города!" },
      { text: "🏃 Эвакуироваться", nextId: 18, xp: 30, score: 100, consequence: "Ты спасся, но город пал" }
    ]
  },
  {
    id: 7,
    title: "Победа",
    text: "Твоя агрессия сломила противника! Толпа в восторге. Ты становишься легендой арены!",
    choices: [
      { text: "👑 Стать чемпионом", nextId: 19, xp: 150, score: 400, consequence: "Бессмертная слава!" },
      { text: "💼 Открыть школу бойцов", nextId: 20, xp: 130, score: 380, consequence: "Ты наставник героев!" }
    ]
  },
  {
    id: 8,
    title: "Выносливость",
    text: "Защитная тактика измотала врага. Он сдается. Публика аплодирует твоему терпению.",
    choices: [
      { text: "🏆 Принять награду", nextId: 19, xp: 140, score: 370, consequence: "Заслуженная победа!" },
      { text: "🤝 Пожать руку сопернику", nextId: 21, xp: 160, score: 410, consequence: "Уважение важнее победы!" }
    ]
  },
  {
    id: 9,
    title: "Мастерство",
    text: "Твоя стратегия безупречна! Противник не успевает реагировать. Это искусство, а не бой.",
    choices: [
      { text: "📈 Подняться в рейтинге", nextId: 19, xp: 170, score: 440, consequence: "Топ-1 игрок!" },
      { text: "📚 Написать руководство", nextId: 22, xp: 180, score: 460, consequence: "Твои методы изучают все!" }
    ]
  },
  {
    id: 10,
    title: "Взлом",
    text: "Вместе с хакерами ты проникаешь в систему корпорации. Файлы раскрывают страшную правду о контроле над городом.",
    choices: [
      { text: "📢 Опубликовать правду", nextId: 23, xp: 200, score: 550, consequence: "Революция началась!" },
      { text: "💰 Продать информацию", nextId: 24, xp: 150, score: 450, consequence: "Богатство и власть!" },
      { text: "🔥 Уничтожить корпорацию", nextId: 25, xp: 250, score: 600, consequence: "Система пала!" }
    ]
  },
  {
    id: 11,
    title: "Одиночество",
    text: "Ты действуешь в одиночку. Это сложнее, но свобода бесценна. Перед тобой открывается путь странника.",
    choices: [
      { text: "🌍 Исследовать новые районы", nextId: 26, xp: 110, score: 300, consequence: "Открыты новые локации!" },
      { text: "🎮 Вернуться к играм", nextId: 27, xp: 80, score: 220, consequence: "Одиночная игра продолжается" }
    ]
  },
  {
    id: 12,
    title: "Сделка",
    text: "Хакеры платят хорошо. Ты получаешь ресурсы и информацию. Теперь ты влиятельная фигура в городе.",
    choices: [
      { text: "🏢 Основать компанию", nextId: 28, xp: 190, score: 480, consequence: "Бизнес-империя растет!" },
      { text: "🕵️ Стать информационным брокером", nextId: 29, xp: 170, score: 470, consequence: "Знаешь все тайны!" }
    ]
  },
  {
    id: 13,
    title: "Цифровое Божество",
    text: "Ты вошел в портал и слился с кодом реальности. Теперь ты контролируешь цифровой мир. Это абсолютная власть!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 300, score: 1000, consequence: "ФИНАЛ: Цифровой Бог" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 14,
    title: "Хранитель Знаний",
    text: "Ты скопировал код реальности. Теперь у тебя знания для создания любой технологии. Мир изменится навсегда!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 250, score: 800, consequence: "ФИНАЛ: Технологический Мессия" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 15,
    title: "Творец Миров",
    text: "Ты материализовал новую реальность - идеальный город, где царят справедливость и гармония. Ты создатель утопии!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 280, score: 900, consequence: "ФИНАЛ: Архитектор Будущего" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 16,
    title: "Инженерный Гений",
    text: "Улучшенная технология распространяется по городу. Ты изменил жизни миллионов. Прогресс неостановим!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 260, score: 850, consequence: "ФИНАЛ: Инноватор Эпохи" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 17,
    title: "Защитник",
    text: "Ты отразил кибер-атаку! Город спасен благодаря твоей смелости. Ты навсегда вписан в историю как герой!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 200, score: 650, consequence: "ФИНАЛ: Герой Города" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 18,
    title: "Выживший",
    text: "Ты спасся, но город пал. Теперь ты скитаешься по руинам неоновой мечты, которую не смог защитить...",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 50, score: 150, consequence: "ФИНАЛ: Последний Свидетель" }
    ],
    isEnding: true,
    endingType: 'bad'
  },
  {
    id: 19,
    title: "Легенда Арены",
    text: "Твое имя знают все! Ты чемпион, легенда, вдохновение для тысяч. Арена - твой дом!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 220, score: 700, consequence: "ФИНАЛ: Непобедимый Чемпион" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 20,
    title: "Мастер-Наставник",
    text: "Твоя школа выпускает лучших бойцов города. Ты не просто боец - ты учитель поколений!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 240, score: 750, consequence: "ФИНАЛ: Великий Наставник" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 21,
    title: "Рыцарь Чести",
    text: "Ты показал, что честь важнее победы. Твой жест уважения изменил культуру арены навсегда!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 260, score: 780, consequence: "ФИНАЛ: Символ Чести" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 22,
    title: "Стратег",
    text: "Твое руководство стало бестселлером. Миллионы изучают твои методы. Ты гений тактики!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 270, score: 820, consequence: "ФИНАЛ: Мастер Стратегии" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 23,
    title: "Революционер",
    text: "Правда освобождена! Люди восстали против корпорации. Началась новая эра свободы. Ты - искра революции!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 300, score: 1100, consequence: "ФИНАЛ: Освободитель" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 24,
    title: "Олигарх",
    text: "Информация принесла богатство. Теперь ты один из самых влиятельных людей города. Власть и деньги - твои!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 180, score: 600, consequence: "ФИНАЛ: Теневой Магнат" }
    ],
    isEnding: true,
    endingType: 'neutral'
  },
  {
    id: 25,
    title: "Разрушитель Системы",
    text: "Корпорация уничтожена! Система контроля пала. Хаос и свобода захлестнули город. Ты создал новый порядок!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 350, score: 1200, consequence: "ФИНАЛ: Анархист-Освободитель" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 26,
    title: "Первооткрыватель",
    text: "Ты открыл новые районы города, полные тайн и возможностей. Твоя карта стала легендарной!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 210, score: 680, consequence: "ФИНАЛ: Картограф Киберпанка" }
    ],
    isEnding: true,
    endingType: 'neutral'
  },
  {
    id: 27,
    title: "Одиночный Игрок",
    text: "Ты остался верен себе. В мире неона ты нашел свой путь - играть в одиночку и побеждать.",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 150, score: 500, consequence: "ФИНАЛ: Волк-Одиночка" }
    ],
    isEnding: true,
    endingType: 'neutral'
  },
  {
    id: 28,
    title: "Корпоративный Титан",
    text: "Твоя компания стала гигантом индустрии. Ты контролируешь экономику города. Бизнес-империя процветает!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 280, score: 950, consequence: "ФИНАЛ: Бизнес-Император" }
    ],
    isEnding: true,
    endingType: 'good'
  },
  {
    id: 29,
    title: "Информационный Брокер",
    text: "Ты знаешь все тайны города. Информация - твое оружие. Каждый нуждается в твоих услугах!",
    choices: [
      { text: "🎯 Завершить путь", nextId: -1, xp: 260, score: 880, consequence: "ФИНАЛ: Хранитель Тайн" }
    ],
    isEnding: true,
    endingType: 'good'
  }
];

export default function Index() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{levels: number, price: number} | null>(null);
  const [tempName, setTempName] = useState('');
  
  const [player, setPlayer] = useState<PlayerData>(() => {
    const saved = localStorage.getItem('playerData');
    return saved ? JSON.parse(saved) : {
      name: 'Игрок',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      score: 0,
      clicks: 0,
      storyProgress: 0,
      endings: []
    };
  });

  const [currentStoryNode, setCurrentStoryNode] = useState(0);
  const [showConsequence, setShowConsequence] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('playerData');
    if (!saved) {
      setShowNameDialog(true);
    }
  }, []);

  const leaderboard: LeaderboardEntry[] = [
    { name: 'CyberPro', score: 15420, level: 25 },
    { name: 'NeonMaster', score: 12890, level: 22 },
    { name: 'GlowHunter', score: 10340, level: 19 },
    { name: player.name, score: player.score, level: player.level },
    { name: 'PixelWave', score: 8220, level: 17 },
  ].sort((a, b) => b.score - a.score);

  useEffect(() => {
    localStorage.setItem('playerData', JSON.stringify(player));
  }, [player]);

  const handleStoryChoice = (choice: { text: string; nextId: number; xp: number; score: number; consequence?: string }) => {
    const earnedXP = choice.xp;
    const earnedScore = choice.score;

    setShowConsequence(choice.consequence || '');
    
    setTimeout(() => {
      setShowConsequence('');
      
      setPlayer(prev => {
        const newXP = prev.xp + earnedXP;
        const newScore = prev.score + earnedScore;
        const newStoryProgress = Math.max(prev.storyProgress, choice.nextId);
        
        if (newXP >= prev.xpToNextLevel) {
          toast({
            title: "🎉 Новый уровень!",
            description: `Поздравляю! Теперь ты ${prev.level + 1} уровня!`,
          });
          
          const updated = {
            ...prev,
            level: prev.level + 1,
            xp: newXP - prev.xpToNextLevel,
            xpToNextLevel: Math.floor(prev.xpToNextLevel * 1.5),
            score: newScore,
            storyProgress: newStoryProgress
          };

          const node = storyNodes.find(n => n.id === choice.nextId);
          if (node?.isEnding && choice.consequence) {
            const endingName = choice.consequence.replace('ФИНАЛ: ', '');
            if (!prev.endings.includes(endingName)) {
              updated.endings = [...prev.endings, endingName];
            }
          }

          return updated;
        }
        
        const updated = {
          ...prev,
          xp: newXP,
          score: newScore,
          storyProgress: newStoryProgress
        };

        const node = storyNodes.find(n => n.id === choice.nextId);
        if (node?.isEnding && choice.consequence) {
          const endingName = choice.consequence.replace('ФИНАЛ: ', '');
          if (!prev.endings.includes(endingName)) {
            updated.endings = [...prev.endings, endingName];
          }
        }

        return updated;
      });

      const nextNode = storyNodes.find(n => n.id === choice.nextId);
      if (nextNode) {
        if (nextNode.isEnding) {
          toast({
            title: choice.consequence?.includes('ФИНАЛ:') ? "🏆 Концовка получена!" : "✨ История завершена!",
            description: `+${earnedXP} XP • +${earnedScore} очков`,
          });
          setTimeout(() => {
            setCurrentStoryNode(0);
            setGameState('menu');
          }, 2000);
        } else {
          setCurrentStoryNode(choice.nextId);
          toast({
            title: "📖 История продолжается",
            description: `+${earnedXP} XP • +${earnedScore} очков`,
          });
        }
      }
    }, 1500);
  };

  const shareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "📋 Ссылка скопирована",
      description: "Поделись игрой с друзьями!",
    });
  };

  const openVK = () => {
    window.open('https://vk.com/share.php?url=' + encodeURIComponent(window.location.href), '_blank');
  };

  const handleNameChange = () => {
    if (tempName.trim().length < 2) {
      toast({
        title: "Ошибка",
        description: "Никнейм должен содержать минимум 2 символа",
        variant: "destructive"
      });
      return;
    }

    setPlayer(prev => ({ ...prev, name: tempName.trim() }));
    setShowNameDialog(false);
    toast({
      title: "🎮 Добро пожаловать!",
      description: `Привет, ${tempName.trim()}! Начинай игру!`,
    });
  };

  const openEditName = () => {
    setTempName(player.name);
    setShowNameDialog(true);
  };

  const levelPackages = [
    { levels: 5, price: 199, popular: false },
    { levels: 10, price: 349, popular: true },
    { levels: 25, price: 799, popular: false },
    { levels: 50, price: 1499, popular: false },
  ];

  const handleBuyLevels = (pkg: {levels: number, price: number}) => {
    setSelectedPackage(pkg);
    setShowPaymentDialog(true);
  };

  const processPayment = () => {
    if (!selectedPackage) return;

    toast({
      title: "💳 Обработка платежа...",
      description: "Переход на страницу оплаты",
    });

    const amount = selectedPackage.price;
    const description = `Покупка ${selectedPackage.levels} уровней в Neon Clicker`;
    const paymentUrl = `https://yoomoney.ru/quickpay/confirm?receiver=410011234567890&quickpay-form=shop&targets=${encodeURIComponent(description)}&paymentType=SB&sum=${amount}`;
    
    window.open(paymentUrl, '_blank');
    setShowPaymentDialog(false);

    setTimeout(() => {
      const confirmPurchase = confirm(`Подтвердите покупку ${selectedPackage.levels} уровней. Оплата прошла успешно?`);
      if (confirmPurchase) {
        setPlayer(prev => ({
          ...prev,
          level: prev.level + selectedPackage.levels,
          xpToNextLevel: Math.floor(prev.xpToNextLevel * Math.pow(1.5, selectedPackage.levels))
        }));
        toast({
          title: "🎉 Покупка завершена!",
          description: `+${selectedPackage.levels} уровней! Новый уровень: ${player.level + selectedPackage.levels}`,
        });
        setGameState('menu');
      }
    }, 2000);
  };

  if (gameState === 'shop') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-yellow-950/20 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent"></div>
        
        <Card className="relative w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-2 border-yellow-500/30 neon-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGameState('menu')}
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-yellow-400" style={{textShadow: '0 0 10px #fbbf24, 0 0 20px #fbbf24'}}>Магазин уровней</h2>
              <p className="text-muted-foreground">Прокачайся мгновенно!</p>
            </div>
            
            <div className="space-y-3">
              {levelPackages.map((pkg, index) => (
                <div
                  key={index}
                  className={`relative p-5 rounded-lg border-2 transition-all hover:scale-105 ${
                    pkg.popular
                      ? 'bg-primary/20 border-primary neon-border'
                      : 'bg-muted/30 border-yellow-500/50'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-bold neon-border">
                      🔥 ПОПУЛЯРНО
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">+{pkg.levels} уровней</div>
                      <div className="text-sm text-muted-foreground mt-1">Мгновенное повышение</div>
                    </div>
                    
                    <Button
                      onClick={() => handleBuyLevels(pkg)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 font-bold border-2 border-yellow-400/50"
                    >
                      {pkg.price} ₽
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5 text-green-400" />
                <span>Мгновенное зачисление уровней</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5 text-green-400" />
                <span>Безопасные платежи через ЮMoney</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5 text-green-400" />
                <span>Поддержка 24/7</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'playing') {
    const node = storyNodes.find(n => n.id === currentStoryNode);
    if (!node) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        
        <Card className="relative w-full max-w-2xl p-8 bg-card/80 backdrop-blur-xl border-2 border-primary/30 neon-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentStoryNode(0);
              setGameState('menu');
            }}
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>

          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Уровень {player.level}</div>
              <h2 className="text-3xl font-bold neon-glow">{node.title}</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Опыт</span>
                <span>{player.xp} / {player.xpToNextLevel}</span>
              </div>
              <Progress value={(player.xp / player.xpToNextLevel) * 100} className="h-3" />
            </div>

            <div className="bg-muted/50 rounded-lg p-6 min-h-[120px] flex items-center justify-center">
              <p className="text-lg leading-relaxed">{node.text}</p>
            </div>

            {showConsequence && (
              <div className="bg-primary/20 border-2 border-primary rounded-lg p-4 animate-pulse-glow">
                <p className="text-neon-cyan font-bold">💫 {showConsequence}</p>
              </div>
            )}

            {!showConsequence && (
              <div className="space-y-3">
                {node.choices.map((choice, index) => (
                  <Button
                    key={index}
                    onClick={() => handleStoryChoice(choice)}
                    className="w-full h-auto py-4 px-6 text-left justify-start bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/40 hover:to-secondary/40 border-2 border-primary/30 hover:border-primary transition-all hover:scale-105 neon-border"
                  >
                    <div className="w-full">
                      <div className="font-bold text-base mb-1">{choice.text}</div>
                      <div className="text-xs text-muted-foreground">
                        +{choice.xp} XP • +{choice.score} очков
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Узнано концовок: {player.endings.length} / 21
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-cyan-950/20 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent"></div>
        
        <Card className="relative w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-2 border-secondary/30 neon-border-cyan">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGameState('menu')}
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center neon-glow-cyan">Рейтинг игроков</h2>
            
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:scale-105 ${
                    entry.name === player.name
                      ? 'bg-primary/20 border-primary neon-border'
                      : 'bg-muted/30 border-muted'
                  }`}
                >
                  <div className={`text-2xl font-bold min-w-[40px] ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-orange-400' :
                    'text-muted-foreground'
                  }`}>
                    #{index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold">{entry.name}</div>
                    <div className="text-sm text-muted-foreground">Уровень {entry.level}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg text-neon-cyan">{entry.score.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">очков</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-pink-950/20 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent"></div>
        
        <Card className="relative w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-2 border-accent/30 neon-border-pink">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGameState('menu')}
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>

          <div className="space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-4xl font-bold neon-border animate-pulse-glow">
                {player.level}
              </div>
              <h2 className="text-3xl font-bold neon-glow-pink">{player.name}</h2>
              <p className="text-muted-foreground">Исследователь неонового мира</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Прогресс до уровня {player.level + 1}</span>
                <span>{player.xp} / {player.xpToNextLevel}</span>
              </div>
              <Progress value={(player.xp / player.xpToNextLevel) * 100} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center border border-primary/20">
                <div className="text-3xl font-bold text-neon-purple">{player.score.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Очки</div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center border border-secondary/20">
                <div className="text-3xl font-bold text-neon-cyan">{player.endings.length}</div>
                <div className="text-sm text-muted-foreground">Концовок</div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-accent/20">
              <h3 className="font-semibold text-center">Полученные концовки</h3>
              {player.endings.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {player.endings.map((ending, index) => (
                    <div key={index} className="bg-primary/10 rounded px-3 py-2 text-sm border border-primary/30">
                      🏆 {ending}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Пройди историю, чтобы открыть концовки!
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <Card className="relative w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-2 border-primary/30 neon-border">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-black neon-glow animate-pulse-glow">NEON STORY</h1>
            <p className="text-muted-foreground">Выбирай • Исследуй • Открывай концовки</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setCurrentStoryNode(0);
                setGameState('playing');
              }}
              className="w-full text-lg h-14 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all hover:scale-105 neon-border font-bold"
            >
              <Icon name="Play" size={24} className="mr-2" />
              ИГРАТЬ
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setGameState('leaderboard')}
                variant="outline"
                className="h-12 border-2 border-secondary/50 hover:border-secondary hover:bg-secondary/20 transition-all hover:scale-105"
              >
                <Icon name="Trophy" size={20} className="mr-2" />
                Рейтинг
              </Button>

              <Button
                onClick={() => setGameState('profile')}
                variant="outline"
                className="h-12 border-2 border-accent/50 hover:border-accent hover:bg-accent/20 transition-all hover:scale-105"
              >
                <Icon name="User" size={20} className="mr-2" />
                Профиль
              </Button>
            </div>

            <Button
              onClick={() => setGameState('shop')}
              className="w-full h-14 text-lg bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:opacity-90 transition-all hover:scale-105 border-2 border-yellow-400/50 font-bold relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              <Icon name="ShoppingBag" size={24} className="mr-2" />
              КУПИТЬ УРОВНИ 💎
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={openVK}
                variant="outline"
                className="h-12 border-2 border-primary/30 hover:border-primary hover:bg-primary/20 transition-all hover:scale-105"
              >
                <Icon name="Share2" size={20} className="mr-2" />
                ВК
              </Button>

              <Button
                onClick={shareLink}
                variant="outline"
                className="h-12 border-2 border-primary/30 hover:border-primary hover:bg-primary/20 transition-all hover:scale-105"
              >
                <Icon name="Link" size={20} className="mr-2" />
                Поделиться
              </Button>
            </div>
          </div>

          <div className="pt-4 space-y-2 border-t border-primary/20">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Игрок</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={openEditName}
                className="font-bold text-neon-pink hover:text-accent h-auto p-1"
              >
                {player.name} <Icon name="Pencil" size={14} className="ml-1" />
              </Button>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Уровень</span>
              <span className="font-bold text-neon-purple">{player.level}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Очки</span>
              <span className="font-bold text-neon-cyan">{player.score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Концовки</span>
              <span className="font-bold text-neon-pink">{player.endings.length} / 21</span>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-2 border-yellow-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-yellow-400" style={{textShadow: '0 0 10px #fbbf24'}}>
              Подтверждение покупки
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Вы приобретаете уровни для своего персонажа
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-6 space-y-3 border border-yellow-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Пакет:</span>
                  <span className="text-xl font-bold text-yellow-400">+{selectedPackage.levels} уровней</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Текущий уровень:</span>
                  <span className="font-bold">{player.level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Новый уровень:</span>
                  <span className="text-xl font-bold text-neon-cyan">{player.level + selectedPackage.levels}</span>
                </div>
                <div className="border-t border-muted pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Итого:</span>
                    <span className="text-2xl font-bold text-yellow-400">{selectedPackage.price} ₽</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-center text-muted-foreground">
                Вы будете перенаправлены на страницу оплаты ЮMoney
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={processPayment}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 font-bold"
            >
              <Icon name="CreditCard" size={20} className="mr-2" />
              Оплатить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-2 border-primary/30 neon-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold neon-glow text-center">
              Введи свой никнейм
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Это имя будет отображаться в рейтинге игроков
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              placeholder="Твой никнейм..."
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameChange();
                }
              }}
              maxLength={20}
              className="text-center text-lg h-12 border-2 border-primary/30 focus:border-primary bg-background/50"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              От 2 до 20 символов
            </p>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              onClick={handleNameChange}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all hover:scale-105 neon-border font-bold"
            >
              <Icon name="Check" size={20} className="mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
