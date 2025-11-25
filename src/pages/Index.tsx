import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

type GameState = 'menu' | 'playing' | 'leaderboard' | 'profile';

interface PlayerData {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  score: number;
  clicks: number;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
}

export default function Index() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [tempName, setTempName] = useState('');
  
  const [player, setPlayer] = useState<PlayerData>(() => {
    const saved = localStorage.getItem('playerData');
    return saved ? JSON.parse(saved) : {
      name: 'Игрок',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      score: 0,
      clicks: 0
    };
  });

  const [targetClicks, setTargetClicks] = useState(10);
  const [gameClicks, setGameClicks] = useState(0);
  const [combo, setCombo] = useState(0);

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

  const handleGameClick = () => {
    const newClicks = gameClicks + 1;
    setGameClicks(newClicks);
    setCombo(combo + 1);

    if (newClicks >= targetClicks) {
      const earnedXP = 20 + (combo * 2);
      const earnedScore = 100 + (combo * 10);
      
      setPlayer(prev => {
        const newXP = prev.xp + earnedXP;
        const newScore = prev.score + earnedScore;
        
        if (newXP >= prev.xpToNextLevel) {
          toast({
            title: "🎉 Новый уровень!",
            description: `Поздравляю! Теперь ты ${prev.level + 1} уровня!`,
          });
          
          return {
            ...prev,
            level: prev.level + 1,
            xp: newXP - prev.xpToNextLevel,
            xpToNextLevel: Math.floor(prev.xpToNextLevel * 1.5),
            score: newScore,
            clicks: prev.clicks + newClicks
          };
        }
        
        return {
          ...prev,
          xp: newXP,
          score: newScore,
          clicks: prev.clicks + newClicks
        };
      });

      toast({
        title: "✨ Раунд завершён!",
        description: `+${earnedXP} XP • +${earnedScore} очков • Комбо: ${combo}`,
      });

      setGameClicks(0);
      setCombo(0);
      setTargetClicks(prev => prev + 5);
    }
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

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        
        <Card className="relative w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-2 border-primary/30 neon-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGameState('menu')}
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>

          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold neon-glow">Уровень {player.level}</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>XP</span>
                <span>{player.xp} / {player.xpToNextLevel}</span>
              </div>
              <Progress value={(player.xp / player.xpToNextLevel) * 100} className="h-3" />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Кликов:</span>
                <span className="font-bold text-neon-cyan">{gameClicks} / {targetClicks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Комбо:</span>
                <span className="font-bold text-neon-pink">x{combo}</span>
              </div>
            </div>

            <button
              onClick={handleGameClick}
              className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent border-4 border-primary/50 hover:border-primary transition-all hover:scale-105 active:scale-95 neon-border animate-pulse-glow font-bold text-2xl"
            >
              КЛИК!
            </button>

            <div className="text-sm text-muted-foreground">
              Кликай быстро, чтобы увеличить комбо! 🔥
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
              <p className="text-muted-foreground">Кибер-игрок</p>
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
                <div className="text-3xl font-bold text-neon-cyan">{player.clicks.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Кликов</div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-accent/20">
              <h3 className="font-semibold text-center">Достижения</h3>
              <div className="grid grid-cols-3 gap-2">
                {player.level >= 5 && (
                  <div className="aspect-square rounded-lg bg-primary/20 border border-primary flex items-center justify-center text-2xl animate-pulse-glow">
                    🏆
                  </div>
                )}
                {player.clicks >= 100 && (
                  <div className="aspect-square rounded-lg bg-secondary/20 border border-secondary flex items-center justify-center text-2xl">
                    ⚡
                  </div>
                )}
                {player.score >= 1000 && (
                  <div className="aspect-square rounded-lg bg-accent/20 border border-accent flex items-center justify-center text-2xl">
                    🌟
                  </div>
                )}
              </div>
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
            <h1 className="text-5xl font-black neon-glow animate-pulse-glow">NEON CLICKER</h1>
            <p className="text-muted-foreground">Кликай • Прокачивайся • Побеждай</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setGameState('playing')}
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
          </div>
        </div>
      </Card>

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