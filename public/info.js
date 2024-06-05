document.addEventListener('DOMContentLoaded', () => {
    const indexButton = document.querySelector('.index-button');
    const indexMenu = document.querySelector('.index-menu');

    indexButton.addEventListener('click', () => {
        indexMenu.classList.toggle('open');
        if (indexMenu.classList.contains('open')) {
            indexMenu.style.visibility = 'visible';
        } else {
            indexMenu.style.visibility = 'hidden';
        }
    });

    const sections = document.querySelectorAll('.info-box, .info-box2');
    const menuLinks = document.querySelectorAll('.index-menu a');

    const makeActive = (link) => menuLinks[link].classList.add('active');
    const removeActive = (link) => menuLinks[link].classList.remove('active');
    const removeAllActive = () => [...Array(sections.length).keys()].forEach((link) => removeActive(link));

    const sectionMargin = 200;
    let currentActive = 0;

    window.addEventListener('scroll', () => {
        const current =
            sections.length -
            [...sections].reverse().findIndex((section) => window.scrollY >= section.offsetTop - sectionMargin) -
            1;

        if (current !== currentActive) {
            removeAllActive();
            currentActive = current;
            makeActive(current);
        }
    });
});
