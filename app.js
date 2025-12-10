import { firestoreApi } from "./firebase-config.js";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

const TIME_SLOTS = [
  "10:30 - 11:30",
  "11:30 - 12:30",
  "12:30 - 1:30",
  "1:30 - 2:30",
  "2:30 - 3:30",
  "3:30 - 4:30",
  "4:30 - 5:30",
  "5:30 - 6:30",
  "6:30 - 7:30",
];

const scheduleGrid = document.getElementById("scheduleGrid");
const classModal = document.getElementById("classModal");
const closeModalBtn = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const daySelect = document.getElementById("daySelect");
const startSlotSelect = document.getElementById("startSlot");
const endSlotSelect = document.getElementById("endSlot");
const courseCodeInput = document.getElementById("courseCode");
const sectionInput = document.getElementById("section");
const roomInput = document.getElementById("room");
const absencesValue = document.getElementById("absencesValue");
const decAbsencesBtn = document.getElementById("decAbsences");
const incAbsencesBtn = document.getElementById("incAbsences");
const assignmentsList = document.getElementById("assignmentsList");
const assignmentTitleInput = document.getElementById("assignmentTitle");
const assignmentDueInput = document.getElementById("assignmentDue");
const addAssignmentBtn = document.getElementById("addAssignment");
const deleteClassBtn = document.getElementById("deleteClass");
const saveClassBtn = document.getElementById("saveClass");
const clearAllBtn = document.getElementById("clearAll");

let classesById = new Map();
let currentEditingId = null;
let anchorDay = null;
let anchorSlotIndex = null;

function getDayCell(day, slotIndex) {
  const cells = scheduleGrid.children;
  for (let i = 0; i < cells.length; i++) {
    const el = cells[i];
    if (!el.classList.contains("day-cell")) continue;
    if (el.dataset.day === day && Number(el.dataset.slotIndex) === slotIndex) {
      return el;
    }
  }
  return null;
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : `cls_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function buildGrid() {
  // Build fixed time column
  const timeColumnCells = document.getElementById("timeColumnCells");
  timeColumnCells.innerHTML = "";
  TIME_SLOTS.forEach((slot) => {
    const timeCell = document.createElement("div");
    timeCell.className = "time-cell";
    timeCell.textContent = slot;
    timeColumnCells.appendChild(timeCell);
  });

  // Build day cells grid (no time cells here)
  scheduleGrid.innerHTML = "";
  TIME_SLOTS.forEach((slot, slotIndex) => {
    DAYS.forEach((day) => {
      const cell = document.createElement("div");
      cell.className = "day-cell empty";
      cell.dataset.day = day;
      cell.dataset.slotIndex = String(slotIndex);
      cell.addEventListener("click", () => handleCellClick(day, slotIndex));
      scheduleGrid.appendChild(cell);
    });
  });
}

function openModalForNew(day, slotIndex) {
  currentEditingId = null;
  anchorDay = day;
  anchorSlotIndex = slotIndex;

  daySelect.value = day;
  startSlotSelect.value = String(slotIndex);
  endSlotSelect.value = String(slotIndex);
  courseCodeInput.value = "";
  sectionInput.value = "";
  roomInput.value = "";
  absencesValue.textContent = "0";
  assignmentsList.innerHTML = "";
  assignmentTitleInput.value = "";
  assignmentDueInput.value = "";

  modalTitle.textContent = `New Class – ${capitalise(day)} @ ${TIME_SLOTS[slotIndex]}`;
  classModal.classList.remove("hidden");
}

function openModalForExisting(cls) {
  currentEditingId = cls.id;
  anchorDay = cls.day;
  anchorSlotIndex = cls.startIndex;

  daySelect.value = cls.day;
  startSlotSelect.value = String(cls.startIndex);
  endSlotSelect.value = String(cls.endIndex);
  courseCodeInput.value = cls.courseCode || "";
  sectionInput.value = cls.section || "";
  roomInput.value = cls.room || "";
  absencesValue.textContent = String(cls.absences ?? 0);
  assignmentTitleInput.value = "";
  assignmentDueInput.value = "";

  renderAssignments(cls.assignments || []);

  modalTitle.textContent = `${cls.courseCode || "Class"} – ${capitalise(cls.day)}`;
  classModal.classList.remove("hidden");
}

function closeModal() {
  classModal.classList.add("hidden");
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function handleCellClick(day, slotIndex) {
  const existing = findClassAt(day, slotIndex);
  if (existing) {
    openModalForExisting(existing);
  } else {
    openModalForNew(day, slotIndex);
  }
}

function findClassAt(day, slotIndex) {
  for (const cls of classesById.values()) {
    if (cls.day === day && slotIndex >= cls.startIndex && slotIndex <= cls.endIndex) {
      return cls;
    }
  }
  return null;
}

function renderAssignments(assignments) {
  assignmentsList.innerHTML = "";
  assignments
    .slice()
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .forEach((a) => {
      const li = document.createElement("li");
      li.className = "assignment-item";

      const main = document.createElement("div");
      main.className = "assignment-main";

      const title = document.createElement("div");
      title.className = "assignment-title";
      title.textContent = a.title || "Untitled";

      const meta = document.createElement("div");
      meta.className = "assignment-meta";
      if (a.dueDate) {
        meta.textContent = `Due ${a.dueDate}`;
      } else {
        meta.textContent = "No due date";
      }

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "assignment-actions";

      const done = document.createElement("div");
      done.className = "checkbox-pill" + (a.completed ? " checked" : "");
      done.textContent = a.completed ? "✓" : "";
      done.addEventListener("click", () => toggleAssignmentCompleted(a.id));

      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", () => deleteAssignment(a.id));

      actions.appendChild(done);
      actions.appendChild(delBtn);

      li.appendChild(main);
      li.appendChild(actions);

      assignmentsList.appendChild(li);
    });
}

function getCurrentAssignments() {
  const cls = currentEditingId ? classesById.get(currentEditingId) : null;
  return cls?.assignments ? [...cls.assignments] : [];
}

function addAssignment() {
  const title = assignmentTitleInput.value.trim();
  const dueDate = assignmentDueInput.value || null;
  if (!title) return;

  const assignments = getCurrentAssignments();
  const id = generateId();
  assignments.push({ id, title, dueDate, completed: false });

  updateCurrentAssignments(assignments);
  assignmentTitleInput.value = "";
  assignmentDueInput.value = "";
}

function toggleAssignmentCompleted(id) {
  const assignments = getCurrentAssignments().map((a) =>
    a.id === id ? { ...a, completed: !a.completed } : a
  );
  updateCurrentAssignments(assignments);
}

function deleteAssignment(id) {
  const assignments = getCurrentAssignments().filter((a) => a.id !== id);
  updateCurrentAssignments(assignments);
}

function updateCurrentAssignments(assignments) {
  if (!currentEditingId) {
    renderAssignments(assignments);
    return;
  }
  const cls = classesById.get(currentEditingId);
  if (!cls) return;
  const updated = { ...cls, assignments };
  classesById.set(updated.id, updated);
  renderAssignments(assignments);
  renderSchedule();
  saveClassToFirestore(updated).catch((err) => console.error("Failed to update assignments", err));
}

function handleAbsences(delta) {
  const value = Math.max(0, Number(absencesValue.textContent || 0) + delta);
  absencesValue.textContent = String(value);
}

async function saveClassFromModal() {
  const day = daySelect.value;
  const startIndex = Number(startSlotSelect.value);
  const endIndex = Number(endSlotSelect.value);
  const courseCode = courseCodeInput.value.trim();
  const section = sectionInput.value.trim();
  const room = roomInput.value.trim();
  const absences = Number(absencesValue.textContent || 0);

  if (!courseCode) {
    alert("Please enter a course code.");
    return;
  }

  const s = Math.min(startIndex, endIndex);
  const e = Math.max(startIndex, endIndex);

  for (const cls of classesById.values()) {
    if (currentEditingId && cls.id === currentEditingId) continue;
    if (cls.day !== day) continue;
    if (s <= cls.endIndex && e >= cls.startIndex) {
      if (!confirm("This overlaps another class. Save anyway?")) {
        return;
      }
      break;
    }
  }

  const base = currentEditingId ? classesById.get(currentEditingId) || {} : {};
  const id = currentEditingId || generateId();

  const cls = {
    id,
    day,
    startIndex: s,
    endIndex: e,
    courseCode,
    section,
    room,
    absences,
    assignments: base.assignments || [],
  };

  console.log("[saveClassFromModal] saving class", cls);

  classesById.set(id, cls);
  renderSchedule();

  try {
    await saveClassToFirestore(cls);
  } catch (err) {
    console.error("Failed to save class", err);
    alert("Failed to save class to Firebase. Check console for details.");
  }

  closeModal();
}

async function deleteCurrentClass() {
  if (!currentEditingId) {
    closeModal();
    return;
  }
  const id = currentEditingId;
  const cls = classesById.get(id);
  if (!cls) {
    closeModal();
    return;
  }
  if (!confirm(`Delete ${cls.courseCode || "this class"}?`)) return;

  classesById.delete(id);
  renderSchedule();

  try {
    await deleteClassFromFirestore(id);
  } catch (err) {
    console.error("Failed to delete class", err);
    alert("Failed to delete class from Firebase. Check console for details.");
  }

  closeModal();
}

function renderSchedule() {
  buildGrid();

  // Group classes by day, then find mergeable consecutive slots
  const classesByDay = {};
  for (const cls of classesById.values()) {
    if (!classesByDay[cls.day]) classesByDay[cls.day] = [];
    classesByDay[cls.day].push(cls);
  }

  for (const day of DAYS) {
    const dayClasses = classesByDay[day] || [];
    
    // Build a map: slotIndex -> class occupying it
    const slotMap = {};
    for (const cls of dayClasses) {
      for (let i = cls.startIndex; i <= cls.endIndex; i++) {
        slotMap[i] = cls;
      }
    }

    // Track which slots we've already rendered
    const rendered = new Set();

    for (let slotIndex = 0; slotIndex < TIME_SLOTS.length; slotIndex++) {
      if (rendered.has(slotIndex)) continue;
      
      const cls = slotMap[slotIndex];
      if (!cls) continue;

      // Find consecutive slots with identical details
      const key = `${cls.courseCode}|${cls.section}|${cls.room}`;
      let endSlot = slotIndex;
      while (
        endSlot + 1 < TIME_SLOTS.length &&
        slotMap[endSlot + 1] &&
        `${slotMap[endSlot + 1].courseCode}|${slotMap[endSlot + 1].section}|${slotMap[endSlot + 1].room}` === key
      ) {
        endSlot++;
      }

      const rowSpan = endSlot - slotIndex + 1;

      // Mark slots as rendered
      for (let i = slotIndex; i <= endSlot; i++) {
        rendered.add(i);
      }

      // Render: one block in first cell, hide the rest
      for (let i = slotIndex; i <= endSlot; i++) {
        const cell = getDayCell(day, i);
        if (!cell) continue;

        cell.classList.remove("empty");

        if (i === slotIndex) {
          // First cell: create the block
          if (rowSpan > 1) {
            cell.style.overflow = "visible";
            cell.style.zIndex = "2";
          }
          const block = document.createElement("div");
          block.className = "class-block";
          if (rowSpan > 1) {
            block.style.position = "absolute";
            block.style.top = "6px";
            block.style.left = "6px";
            block.style.right = "6px";
            block.style.height = `calc(${rowSpan * 100}% - 12px + ${(rowSpan - 1) * 1}px)`;
          }
          block.addEventListener("click", (ev) => {
            ev.stopPropagation();
            openModalForExisting(cls);
          });

          const mainRow = document.createElement("div");
          mainRow.className = "class-line-main";

          const course = document.createElement("div");
          course.className = "class-course";
          course.textContent = cls.courseCode;

          const room = document.createElement("div");
          room.className = "class-room";
          room.textContent = cls.room || "";

          mainRow.appendChild(course);
          mainRow.appendChild(room);

          const metaRow = document.createElement("div");
          metaRow.className = "class-meta-row";

          const section = document.createElement("div");
          section.className = "badge badge-soft";
          section.textContent = cls.section || "No section";

          const abs = document.createElement("div");
          abs.className = "badge absences-badge";
          abs.innerHTML = `<span>${cls.absences ?? 0}</span> abs`;

          metaRow.appendChild(section);
          metaRow.appendChild(abs);

          block.appendChild(mainRow);
          block.appendChild(metaRow);

          cell.appendChild(block);
        }
        // Other cells in the merge: leave empty but not clickable for "+"
      }
    }
  }
}

async function saveClassToFirestore(cls) {
  const { classesCol, setDoc, classDoc } = firestoreApi;
  const ref = classDoc(cls.id);
  const payload = {
    id: cls.id,
    day: cls.day,
    startIndex: cls.startIndex,
    endIndex: cls.endIndex,
    courseCode: cls.courseCode,
    section: cls.section,
    room: cls.room,
    absences: cls.absences,
    assignments: cls.assignments || [],
  };
  await setDoc(ref, payload);
}

async function deleteClassFromFirestore(id) {
  const { deleteDoc, classDoc } = firestoreApi;
  const ref = classDoc(id);
  await deleteDoc(ref);
}

async function loadFromFirestore() {
  try {
    const { classesCol, getDocs } = firestoreApi;
    const snapshot = await getDocs(classesCol());
    classesById = new Map();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data) return;
      const cls = {
        id: data.id || docSnap.id,
        day: data.day,
        startIndex: data.startIndex ?? 0,
        endIndex: data.endIndex ?? 0,
        courseCode: data.courseCode || "",
        section: data.section || "",
        room: data.room || "",
        absences: data.absences ?? 0,
        assignments: data.assignments || [],
      };
      classesById.set(cls.id, cls);
    });
    renderSchedule();
  } catch (err) {
    console.error("Failed to load classes from Firebase", err);
    renderSchedule();
  }
}

function initTimeSelectors() {
  startSlotSelect.innerHTML = "";
  endSlotSelect.innerHTML = "";
  TIME_SLOTS.forEach((slot, index) => {
    const opt1 = document.createElement("option");
    opt1.value = String(index);
    opt1.textContent = slot;
    startSlotSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = String(index);
    opt2.textContent = slot;
    endSlotSelect.appendChild(opt2);
  });
}

function attachEventHandlers() {
  closeModalBtn.addEventListener("click", closeModal);
  classModal.addEventListener("click", (e) => {
    if (e.target === classModal) closeModal();
  });

  decAbsencesBtn.addEventListener("click", () => handleAbsences(-1));
  incAbsencesBtn.addEventListener("click", () => handleAbsences(1));

  addAssignmentBtn.addEventListener("click", addAssignment);
  assignmentTitleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAssignment();
    }
  });

  saveClassBtn.addEventListener("click", () => {
    saveClassFromModal();
  });

  deleteClassBtn.addEventListener("click", () => {
    deleteCurrentClass();
  });

  clearAllBtn.addEventListener("click", () => {
    if (!confirm("This only clears the local in-memory view; refresh to reload from Firebase. Continue?")) return;
    classesById = new Map();
    renderSchedule();
  });
}

function init() {
  initTimeSelectors();
  attachEventHandlers();
  buildGrid();
  loadFromFirestore();
}

init();
