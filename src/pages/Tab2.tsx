import { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonIcon, IonText, IonList, IonItem, IonLabel
} from '@ionic/react';
import { notificationsOutline, volumeHighOutline, phonePortraitOutline, flashOutline } from 'ionicons/icons';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const Tab2: React.FC = () => {

  useEffect(() => {
    // Crea el channel al cargar la tab
    crearChannelAltaPrioridad();
  }, []);

  const crearChannelAltaPrioridad = async () => {
    await LocalNotifications.createChannel({
      id: 'neon-high',
      name: 'Neon Focus Alta Prioridad',
      importance: 5,
      sound: 'default',
      visibility: 1,
      lights: true,
      vibration: true
    });
  };

  const checkPermissions = async () => {
    const perm: PermissionStatus = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  };

  const testNotificacionBloqueo = async () => {
    await checkPermissions();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: '🔔 PRUEBA BLOQUEO',
          body: 'Esta notificación DEBE sonar aunque el teléfono esté bloqueado',
          schedule: { at: new Date(Date.now() + 9000) },
          sound: 'default',
          channelId: 'neon-high'
        }
      ]
    });
  };

  const testNotificacionInmediata = async () => {
    await checkPermissions();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1002,
          title: '🔥 PRUEBA INMEDIATA',
          body: 'Debería aparecer AHORA MISMO con sonido fuerte',
          schedule: { at: new Date(Date.now() + 1000) },
          sound: 'default',
          channelId: 'neon-high'
        }
      ]
    });

    await Haptics.vibrate({ duration: 800 });
  };

  const testTodoJunto = async () => {
    await checkPermissions();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1003,
          title: '💥 PRUEBA COMPLETA',
          body: 'Notificación + sonido + vibración en 5 segundos (incluso bloqueado)',
          schedule: { at: new Date(Date.now() + 8000) },
          sound: 'default',
          channelId: 'neon-high'
        }
      ]
    });

    await Haptics.vibrate({ duration: 1000 });
  };

  const testVibracionFuerte = async () => {
    await Haptics.vibrate({ duration: 9000 });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Testing Notificaciones</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="neon-content ion-padding">
        <div className="background-glow" />

        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '60px' }}>
          <IonText>
            <h1 style={{
              textAlign: 'center',
              fontSize: '2rem',
              marginBottom: '60px',
              fontWeight: '300',
              textShadow: '0 0 15px rgba(0, 180, 216, 0.6)'
            }}>
              Zona de Pruebas
            </h1>
          </IonText>

          <IonList>
            <IonItem className="neon-item">
              <IonButton expand="block" color="primary" onClick={testNotificacionBloqueo}>
                <IonIcon icon={notificationsOutline} slot="start" />
                Notificación en 3 seg (incluso bloqueado)
              </IonButton>
            </IonItem>

            <IonItem className="neon-item">
              <IonButton expand="block" color="secondary" onClick={testNotificacionInmediata}>
                <IonIcon icon={flashOutline} slot="start" />
                Notificación + vibración inmediata
              </IonButton>
            </IonItem>

            <IonItem className="neon-item">
              <IonButton expand="block" color="tertiary" onClick={testTodoJunto}>
                <IonIcon icon={volumeHighOutline} slot="start" />
                Prueba completa en 5 seg
              </IonButton>
            </IonItem>

            <IonItem className="neon-item">
              <IonButton expand="block" color="danger" onClick={testVibracionFuerte}>
                <IonIcon icon={phonePortraitOutline} slot="start" />
                Solo vibración fuerte
              </IonButton>
            </IonItem>
          </IonList>

          <IonText color="medium">
            <p style={{ textAlign: 'center', marginTop: '60px', opacity: 0.8 }}>
              1. Desinstala la app vieja<br />
              2. Instala el nuevo APK<br />
              3. Abre → Testing → pulsa botones<br />
              4. Cierra app y bloquea pantalla<br />
              → Debe sonar fuerte
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;