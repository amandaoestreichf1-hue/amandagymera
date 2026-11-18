# 🐰 My Gym Era

Web app instalável (PWA) para organizar a vida ativa da Amanda: semana ideal de treinos,
calendário mensal, hidratação personalizada e a **Bia**, uma coelhinha motivadora.

## O que tem na versão 1

- **Hoje**: treino do dia, botão "Fiz! ✅", hidratação do treino e a Bia reagindo à sua semana.
- **Semana**: sugestão automática equilibrada. Você arrasta (segurando) para trocar dias, troca o treino
  ou marca "não deu", e o app **reajusta o resto da semana**.
- **Mês**: calendário com o que foi feito e o que está planejado.
- **Evolução**: gráfico de treinos por semana, treinos do mês por tipo, semanas ativas seguidas e 23 medalhas.
- **Plano**: objetivo (secar, tonificar, braços, pernas…), data, meta por semana, progressão gradual
  (+1 por semana), dias de estúdio e de casa, horários e modalidades.
- **Hidratação**: antes, durante e depois de cada treino, a partir do perfil de suor (Gatorade Gx),
  ajustado para hot yoga, HIIT etc.

Os dados ficam só no iPhone (localStorage). Em *Plano → Backup* dá pra exportar e importar.

## Instalar no iPhone

1. Abra o link do app no **Safari**.
2. Toque em **Compartilhar** (quadrado com a seta) e depois em **Adicionar à Tela de Início**.
3. Pronto: o ícone da Bia aparece na tela e o app abre em tela cheia, inclusive offline.

## Publicar no GitHub Pages

1. O repositório precisa ser **público** (no plano gratuito).
2. *Settings → Pages → Build and deployment → Source: Deploy from a branch*.
3. Escolha a branch e a pasta `/ (root)` e salve. Em ~1 minuto o link fica
   `https://<usuario>.github.io/amandagymera/`.

## Atualizar a grade dos estúdios

As grades da Tônus, do Race Bootcamp e do Vidya estão em `js/data.js`. Quando mudarem, é só mandar o print.
Ao alterar arquivos, suba a versão em `sw.js` (`VERSION`) para o iPhone baixar a atualização.

## Estrutura

```
index.html            casca do app + barra de abas
css/styles.css        visual lima, lilás, violeta e rosa (claro e escuro)
js/data.js            estúdios, horários, modalidades e objetivos
js/store.js           estado salvo no aparelho + datas
js/planner.js         montagem e reajuste da semana, progressão
js/hydration.js       cálculo de hidratação
js/mascot.js          a coelhinha Bia (SVG animado) e as falas
js/achievements.js    medalhas e estatísticas
js/app.js             telas e interações
fonts/                DM Sans + Instrument Serif (offline)
sw.js                 funciona offline
```

Sem build, sem dependências: são só arquivos estáticos.
