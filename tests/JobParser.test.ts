import { describe, it, expect } from 'vitest';
import { JobParser } from '../src/JobParser';

describe('JobParser', () => {
  it('should parse old LinkedIn HTML job list format', () => {
    const container = document.createElement('ul');
    container.className = 'scaffold-layout__list';
    container.innerHTML = `
      <li data-occludable-job-id="12345">
        <a class="job-card-list__title--link"><strong>Frontend Developer</strong></a>
        <div class="artdeco-entity-lockup__subtitle">TechCorp</div>
      </li>
      <li data-occludable-job-id="67890">
        <a class="job-card-list__title--link"><strong>Backend Developer</strong></a>
        <div class="artdeco-entity-lockup__subtitle">DataInc</div>
      </li>
    `;

    const parser = new JobParser();
    const jobs = parser.parseList(container);

    expect(jobs.length).toBe(2);
    expect(jobs[0].id).toBe('12345');
    expect(jobs[0].title).toBe('Frontend Developer');
    expect(jobs[0]['company']).toBe('TechCorp');

    expect(jobs[1].id).toBe('67890');
    expect(jobs[1].title).toBe('Backend Developer');
    expect(jobs[1]['company']).toBe('DataInc');
  });

  it('should parse new LinkedIn HTML job list format', () => {
    const container = document.createElement('div');
    container.setAttribute('componentkey', 'SearchResultsMainContent');
    container.innerHTML = `
      <div class="_06cf158a f852cf51" data-display-contents="true">
        <div role="button" tabindex="0" componentkey="job-card-component-ref-4455778043">
          <div componentkey="job-card-component-ref-4455778043">
            <button type="button" aria-label="Descartar empleo «Full Stack Developer»"></button>
            <div>
              <p><span class="_170ff3a8">Seleccionado, Full Stack Developer (empleo verificado)</span><span aria-hidden="true">Full Stack Developer</span></p>
              <div><p>Annapurna</p></div>
              <p>Berlín, Alemania (En remoto)</p>
            </div>
          </div>
        </div>
        <div role="button" tabindex="0" componentkey="job-card-component-ref-4298176847">
          <div componentkey="job-card-component-ref-4298176847">
            <button type="button" aria-label="Descartar empleo «Senior Fullstack TS Developer (backend-oriented)»"></button>
            <div>
              <p><span aria-hidden="true">Senior Fullstack TS Developer (backend-oriented)</span></p>
              <div><p>lemlist</p></div>
              <p>Marsella (En remoto)</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const parser = new JobParser();
    const jobs = parser.parseList(container);

    expect(jobs.length).toBe(2);
    expect(jobs[0].id).toBe('4455778043');
    expect(jobs[0].title).toBe('Full Stack Developer');
    expect(jobs[0]['company']).toBe('Annapurna');

    expect(jobs[1].id).toBe('4298176847');
    expect(jobs[1].title).toBe('Senior Fullstack TS Developer (backend-oriented)');
    expect(jobs[1]['company']).toBe('lemlist');
  });
});
