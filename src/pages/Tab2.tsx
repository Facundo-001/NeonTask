import { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonIcon, IonText
} from '@ionic/react';
import { play, pause, refresh } from 'ionicons/icons';
import { Haptics } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

const Tab2: React.FC = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    Preferences.get({ key: 'pomodoroStart' }).then(({ value }) => {
      if (value === 'true') {
        setIsRunning(true);
        Preferences.remove({ key: 'pomodoroStart' });
      }
    });
  }, []);

  useEffect(() => {
    if (isRunning && (minutes > 0 || seconds > 0)) {
      const timer = setTimeout(() => {
        if (seconds === 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isRunning && minutes === 0 && seconds === 0) {
      setIsRunning(false);
      setIsBreak(!isBreak);
      setMinutes(isBreak ? 25 : 5);
      setSeconds(0);

      // Vibración + notificación al terminar
      Haptics.vibrate({ duration: 1000 });
      LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: '⏰ Pomodoro terminado',
          body: isBreak ? '¡Hora de descansar!' : '¡Hora de enfocarte!',
          sound: 'default'
        }]
      });
    }
  }, [isRunning, minutes, seconds, isBreak]);

  const startPause = () => setIsRunning(!isRunning);

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setMinutes(25);
    setSeconds(0);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Pomodoro</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="neon-content ion-text-center">
        <div className="background-glow" />
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px' }}>
          <IonText>
            <h2 style={{ fontSize: '1.7rem', fontWeight: '300', marginBottom: '40px' }}>
              {isBreak ? 'Tiempo de Descanso' : 'Hora de Foco'}
            </h2>
          </IonText>

          <div style={{
            fontSize: '5.5rem',
            fontWeight: '200',
            margin: '40px 0',
            letterSpacing: '4px',
            textShadow: '0 0 20px rgba(0, 180, 216, 0.6)'
          }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          <div>
            <IonButton size="large" color="primary" onClick={startPause} className="neon-button" style={{ margin: '0 10px' }}>
              <IonIcon icon={isRunning ? pause : play} slot="start" />
              {isRunning ? 'Pausar' : 'Iniciar'}
            </IonButton>
            <IonButton size="large" fill="clear" color="medium" onClick={reset}>
              <IonIcon icon={refresh} />
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;