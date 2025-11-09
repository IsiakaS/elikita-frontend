import { Directive, ElementRef, inject, Input } from '@angular/core';

@Directive({
  selector: '[scrolld]'
})
export class ScrolldDirective {
  elementRef = inject(ElementRef);
  @Input() scrolld!: string;
  scroll: number = 0;

  constructor() {

  }

  ngAfterViewInit() {

    if (this.scrolld) {
      //alert(this.scrolld)
      let parentScrolld = this.elementRef.nativeElement.parentElement;

      while (!parentScrolld.className.includes('scrolld-parent')) {
        parentScrolld = parentScrolld.parentElement;
      }
      const unscrollableFixedContainer = parentScrolld.querySelector(".scrollable-container");
      const scrollableParentContainer = parentScrolld.querySelector('.overflow-container');
      const nextBtn = parentScrolld.querySelector('.next-btn');
      const prevBtn = parentScrolld.querySelector('.prev-btn');

      const allCards = parentScrolld.querySelectorAll(`.${this.scrolld}`);



      const obscuredCardIndex = Array.from(allCards).findIndex((card: any) => {
        const cardRect = card.getBoundingClientRect();
        const containerRect = unscrollableFixedContainer.getBoundingClientRect();
        // alert(unscrollableFixedContainer.getBoundingClientRect().right)
        return cardRect.right > containerRect.right;
      });
      // alert(obscuredCardIndex)

      if (obscuredCardIndex == -1) {
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'none';
      } else {
        /*************  ✨ Windsurf Command ⭐  *************/
        /**
         * @description 
         * Finds the first obscured card index on the right, calculates the distance from the right edge of the card to the right edge of the container, 
         * and then scrolls the container to the left by that distance. If the obscured card is not found, it does nothing.
         * @returns {void}
         */
        /*******  8be8fa53-e4e6-4600-a42a-c3e3af45edfb  *******/
        nextBtn.onclick = () => {

          let toAddToScroll = 0;
          let nextObscuredCardIndex = Array.from(allCards).findIndex((card: any) => {
            const cardRect = card.getBoundingClientRect();
            const containerRect = unscrollableFixedContainer.getBoundingClientRect();
            //alert(unscrollableFixedContainer.getBoundingClientRect().right)
            //   return cardRect.right > containerRect.right;
            let anotherToAddToScroll = cardRect.right - containerRect.right;
            // alert(toAddToScroll);
            if (anotherToAddToScroll > 0) {
              toAddToScroll = anotherToAddToScroll
              return true;
            } else {
              return false;
            }
          });
          //alert(nextObscuredCardIndex );
          if (nextObscuredCardIndex > -1) {
            console.log(toAddToScroll);
            unscrollableFixedContainer.style.overflow = 'scroll';
            // Scroll the container
            this.scroll += toAddToScroll;
            unscrollableFixedContainer.scrollTo({
              left: this.scroll + 1,
              behavior: 'smooth'
            });
          }
        };
      }

      prevBtn.onclick = (): any => {
        let toAddToScroll = 0;
        let cardsArr = Array.from(allCards);
        let nextObscuredCardIndex = -1;
        for (let i = cardsArr.length - 1; i--; i > -1) {
          let card: HTMLElement = cardsArr[i] as HTMLElement;
          const cardRect = card.getBoundingClientRect();
          const containerRect = unscrollableFixedContainer.getBoundingClientRect();
          //alert(unscrollableFixedContainer.getBoundingClientRect().right)
          //   return cardRect.right > containerRect.right;
          let anotherToAddToScroll = containerRect.left - cardRect.left;
          // alert(toAddToScroll);
          if (anotherToAddToScroll > 0) {
            toAddToScroll = anotherToAddToScroll
            nextObscuredCardIndex = i;
            // alert(nextObscuredCardIndex + " " + anotherToAddToScroll + " " + i)
            break;
          } else {

          }
        }
        // let nextObscuredCardIndex = Array.from(allCards).findIndex((card: any) => {
        //   const cardRect = card.getBoundingClientRect();
        //   const containerRect = unscrollableFixedContainer.getBoundingClientRect();
        //   //alert(unscrollableFixedContainer.getBoundingClientRect().right)
        //   //   return cardRect.right > containerRect.right;
        //   toAddToScroll = containerRect.left - cardRect.left;
        //   // alert(toAddToScroll);
        //   if (toAddToScroll > 0) {
        //     return true;
        //   } else {
        //     return false;
        //   }
        // });
        //alert(nextObscuredCardIndex );
        if (nextObscuredCardIndex > -1) {
          unscrollableFixedContainer.style.overflow = 'scroll';
          // Scroll the container
          this.scroll -= toAddToScroll;
          unscrollableFixedContainer.scrollTo({
            left: this.scroll - 1,
            behavior: 'smooth'
          });
        }
      }
    } else {
      let parentScrolld = this.elementRef.nativeElement.parentElement;

      while (!parentScrolld.className.includes('scrolld-parent')) {
        parentScrolld = parentScrolld.parentElement;
      }
      const unscrollableFixedContainer = parentScrolld.querySelector(".scrollable-container");
      const scrollableParentContainer = parentScrolld.querySelector('.overflow-container');
      const nextBtn = parentScrolld.querySelector('.next-btn');
      const prevBtn = parentScrolld.querySelector('.prev-btn');

      nextBtn.style.display = 'none';
      prevBtn.style.display = 'none';
    }


  }

  ngOnChanges() {
    if (this.scrolld) {
      //  alert(this.scrolld)
      let parentScrolld = this.elementRef.nativeElement.parentElement;

      while (!parentScrolld.className.includes('scrolld-parent')) {
        parentScrolld = parentScrolld.parentElement;
      }
      const unscrollableFixedContainer = parentScrolld.querySelector(".scrollable-container");
      const scrollableParentContainer = parentScrolld.querySelector('.overflow-container');
      const nextBtn = parentScrolld.querySelector('.next-btn');
      const prevBtn = parentScrolld.querySelector('.prev-btn');

      const allCards = parentScrolld.querySelectorAll(`.${this.scrolld}`);



      const obscuredCardIndex = Array.from(allCards).findIndex((card: any) => {
        const cardRect = card.getBoundingClientRect();
        const containerRect = unscrollableFixedContainer.getBoundingClientRect();
        // alert(unscrollableFixedContainer.getBoundingClientRect().right)
        return cardRect.right > containerRect.right;
      });
      // alert(obscuredCardIndex)

      if (obscuredCardIndex == -1) {
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'none';
      } else {
        nextBtn.style.display = 'flex';
        prevBtn.style.display = 'flex';
        /*************  ✨ Windsurf Command ⭐  *************/
        /**
         * @description 
         * Finds the first obscured card index on the right, calculates the distance from the right edge of the card to the right edge of the container, 
         * and then scrolls the container to the left by that distance. If the obscured card is not found, it does nothing.
         * @returns {void}
         */
        /*******  8be8fa53-e4e6-4600-a42a-c3e3af45edfb  *******/
        nextBtn.onclick = () => {

          let toAddToScroll = 0;
          let nextObscuredCardIndex = Array.from(allCards).findIndex((card: any) => {
            const cardRect = card.getBoundingClientRect();
            const containerRect = unscrollableFixedContainer.getBoundingClientRect();
            //alert(unscrollableFixedContainer.getBoundingClientRect().right)
            //   return cardRect.right > containerRect.right;
            let anotherToAddToScroll = cardRect.right - containerRect.right;
            // alert(toAddToScroll);
            if (anotherToAddToScroll > 0) {
              toAddToScroll = anotherToAddToScroll
              return true;
            } else {
              return false;
            }
          });
          //alert(nextObscuredCardIndex );
          if (nextObscuredCardIndex > -1) {
            console.log(toAddToScroll);
            unscrollableFixedContainer.style.overflow = 'scroll';
            // Scroll the container
            this.scroll += toAddToScroll;
            unscrollableFixedContainer.scrollTo({
              left: this.scroll + 1,
              behavior: 'smooth'
            });
          }
        };
      }

      prevBtn.onclick = (): any => {
        let toAddToScroll = 0;
        let cardsArr = Array.from(allCards);
        let nextObscuredCardIndex = -1;
        for (let i = cardsArr.length - 1; i--; i > -1) {
          let card: HTMLElement = cardsArr[i] as HTMLElement;
          const cardRect = card.getBoundingClientRect();
          const containerRect = unscrollableFixedContainer.getBoundingClientRect();
          //alert(unscrollableFixedContainer.getBoundingClientRect().right)
          //   return cardRect.right > containerRect.right;
          let anotherToAddToScroll = containerRect.left - cardRect.left;
          // alert(toAddToScroll);
          if (anotherToAddToScroll > 0) {
            toAddToScroll = anotherToAddToScroll
            nextObscuredCardIndex = i;
            // alert(nextObscuredCardIndex + " " + anotherToAddToScroll + " " + i)
            break;
          } else {

          }
        }
        // let nextObscuredCardIndex = Array.from(allCards).findIndex((card: any) => {
        //   const cardRect = card.getBoundingClientRect();
        //   const containerRect = unscrollableFixedContainer.getBoundingClientRect();
        //   //alert(unscrollableFixedContainer.getBoundingClientRect().right)
        //   //   return cardRect.right > containerRect.right;
        //   toAddToScroll = containerRect.left - cardRect.left;
        //   // alert(toAddToScroll);
        //   if (toAddToScroll > 0) {
        //     return true;
        //   } else {
        //     return false;
        //   }
        // });
        //alert(nextObscuredCardIndex );
        if (nextObscuredCardIndex > -1) {
          unscrollableFixedContainer.style.overflow = 'scroll';
          // Scroll the container
          this.scroll -= toAddToScroll;
          unscrollableFixedContainer.scrollTo({
            left: this.scroll - 1,
            behavior: 'smooth'
          });
        }
      }
    }
  }

}


