import { Component } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'blanks';

  // Inteface for the data object
  data: {
    type: string;
    questionId: string;
    question: string;
    blanks: Array<{ index: number; answers: string[] }>;
  } = {
    type: 'fillInTheBlanks',
    questionId: '1',
    question: '',
    blanks: [],
  };

  inputStatus: { [key: number]: string } = {};
  renderedText!: string;
  questionParts: any[] = [];
  nextIndex = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  insertBlank() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const index = this.data.blanks.length; // new index based on existing blanks

    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = `Answer`;
    inputElement.id = `input-${this.nextIndex}`;

    inputElement.addEventListener('input', (event) => {
      const blank = this.data.blanks.find((b) => b.index === index);
      if (blank) {
        blank.answers = [(event.target as HTMLInputElement).value];
      }
    });

    this.data.blanks.push({
      index: this.nextIndex,
      answers: [],
    });

    this.nextIndex++;

    this.insertAtCursor(inputElement);
    this.updateQuestion();
  }

  insertAtCursor(element: HTMLElement) {
    const selection = window.getSelection();
    if (selection!.rangeCount) {
      const range = selection!.getRangeAt(0);
      range.deleteContents();
      range.insertNode(element);
      range.setStartAfter(element);
      range.setEndAfter(element);
      selection!.removeAllRanges();
      selection!.addRange(range);
    }
  }

  updateQuestion() {
    const questionContainer = document.getElementById('questionContainer');
    if (questionContainer) {
      this.data.question = '';
      let i = 0;
      questionContainer.childNodes.forEach((node) => {
        if (node.nodeName === 'INPUT') {
          const index = this.data.blanks.find(
            (b) => b.index === parseInt((node as HTMLElement).id.split('-')[1])
          )?.index;
          if (index !== undefined) {
            this.data.question += `{${index}}`;
          }
          i++;
        } else {
          this.data.question += node.textContent || '';
        }
      });
    }
    this.generateQuestionParts();
  }

  checkAnswers() {
    // Clear existing statuses
    this.inputStatus = {};

    // Sort blanks by index
    this.data.blanks.sort((a, b) => a.index - b.index);

    // Loop through each blank and compare its answer with the input value
    this.data.blanks.forEach((blank, index) => {
      const inputElement = document.getElementById(
        `answer-${index}`
      ) as HTMLInputElement;
      const inputValue = inputElement ? inputElement.value : '';
      this.inputStatus[blank.index] = blank.answers.includes(inputValue)
        ? 'correct'
        : 'incorrect';
    });

    // Trigger change detection
    this.cdr.detectChanges();
  }

  generateQuestionParts() {
    const parts = this.data.question.split(/(\{\d+\})/).filter(Boolean);
    this.questionParts = parts.map((part, index) => {
      const match = part.match(/\{(\d+)\}/);
      if (match) {
        const blankIndex = parseInt(match[1], 10);
        return { type: 'blank', index: blankIndex };
      } else {
        return { type: 'text', content: part };
      }
    });
  }
}
