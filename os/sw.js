// Authenticated responses and personal records are never cached.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{let data;try{data=event.data.json()}catch{data={}}
 data=data??{};let link='/os/#/founder';try{const u=new URL(data.url,self.location.origin);if(u.origin===self.location.origin&&u.pathname==='/os/'&&/^#\/(founder|tasks|app|inbox)([/?]|$)/.test(u.hash))link=u.pathname+u.search+u.hash}catch{}
 event.waitUntil(self.registration.showNotification('MEVE OS',{body:'확인할 운영 알림이 있어요.',tag:data.notification_id||'meve-update',data:{url:link}}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.openWindow(event.notification.data?.url||'/os/#/founder'))});
