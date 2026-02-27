
## Reajuste: Dia do calendario pre-selecionado ao adicionar disciplina

### Problema
Quando o aluno seleciona uma data no calendario (ex: dia 24, terca-feira) e clica em "+ Disciplina", o formulario de nova disciplina abre com o dia padrao "Segunda" nos horarios, ignorando a selecao do calendario.

### Solucao
Passar a data selecionada no calendario do `ScheduleView` para o `AddSubjectDrawer`, para que o campo de dia nos horarios ja venha pre-selecionado com o dia da semana correspondente.

### Alteracoes

**1. `src/components/views/ScheduleView.tsx`**
- Alterar `onAddSubject` de `() => void` para `(selectedDay: number) => void`
- No botao "+ Disciplina", chamar `onAddSubject(selectedDate.getDay())` passando o dia da semana da data selecionada

**2. `src/pages/Index.tsx`**
- Ajustar o handler `onAddSubject` para receber o `dayOfWeek: number` e armazena-lo em um novo estado `selectedDayForSubject`
- Passar esse valor como prop `defaultDay` para o `AddSubjectDrawer`

**3. `src/components/AddSubjectDrawer.tsx`**
- Adicionar prop opcional `defaultDay?: number`
- Usar `useEffect` para atualizar o dia inicial dos horarios (`schedules[0].day`) quando o drawer abrir, com base no `defaultDay` recebido
- Assim, ao abrir o formulario, o campo "Dia" ja mostra o dia correto (ex: "Ter" para terca)

### Fluxo resultante
1. Aluno seleciona dia 24 (terca) no calendario
2. Clica em "+ Disciplina"
3. Formulario abre com o campo de horario ja mostrando "Ter" ao inves de "Seg"
