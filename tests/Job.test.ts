import { describe, it, expect } from 'vitest';
import { JobMother } from './mothers/JobMother';
import { ConfigMother } from './mothers/ConfigMother';

describe('Job', () => {
  describe('should update the description', () => {
    it('should update and retrieve description', () => {
      const job = JobMother.create().build();

      job.updateDescription('Full stack developer role');

      expect(job.getDescription()).toBe('Full stack developer role');
    });
  });

  describe('shouldHide the job', () => {
    it('when a global keyword is matched in the title', () => {
      const job = JobMother.create().withTitle('Senior Software Engineer').build();
      const config = ConfigMother.create().withKeywords({
        enabled: true,
        anywhere: ['senior'],
        title: [],
        description: [],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('when a global keyword is matched in the description', () => {
      const job = JobMother.create().withDescription('Looking for senior developers').build();
      const config = ConfigMother.create().withKeywords({
        enabled: true,
        anywhere: ['senior'],
        title: [],
        description: [],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('when a global keyword is matched in both the title and description', () => {
      const job = JobMother.create()
        .withTitle('Software Engineer')
        .withDescription('Full stack developer role')
        .build();
      const config = ConfigMother.create().withKeywords({
        enabled: true,
        anywhere: ['developer'],
        title: [],
        description: [],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('when a title keyword is matched in the title', () => {
      const job = JobMother.create().withTitle('Software Engineer').build();
      const config = ConfigMother.create().withKeywords({
        enabled: true,
        anywhere: [],
        title: ['engineer'],
        description: [],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('when a description keyword is matched in the description', () => {
      const job = JobMother.create().withDescription('Must have TypeScript experience').build();
      const config = ConfigMother.create().withKeywords({
        enabled: true,
        anywhere: [],
        title: [],
        description: ['typescript'],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('when a company keyword is matched in the company', () => {
      const job = JobMother.create().withCompany('Google').build();
      const config = ConfigMother.create().withCompanies({
        enabled: true,
        data: ['google'],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('should not hide a job when no keywords and companies are matched', () => {
      const job = JobMother.create()
        .withTitle('Software Engineer')
        .withCompany('Meta')
        .build();
      const config = ConfigMother.create()
        .withKeywords({
          enabled: true,
          anywhere: ['nonexistent'],
          title: [],
          description: [],
        })
        .withCompanies({
          enabled: true,
          data: ['amazon'],
        })
        .build();

      expect(job.shouldHide(config)).toBe(false);
    });

    it('should not hide a job when a whitelist and a blacklist keyword is matched', () => {
      const job = JobMother.create().withDescription('This is a senior role').build();
      const config = ConfigMother.create()
        .withKeywords({
          enabled: true,
          anywhere: [],
          title: [],
          description: ['senior'],
        })
        .withWhitelist({
          enabled: true,
          data: ['senior'],
        })
        .build();

      expect(job.shouldHide(config)).toBe(false);
    });
  });

  describe('should be able to select a job', () => {
    it('should click the job button when select is called', () => {
      let clicked = false;
      const job = JobMother.create()
        .withId('test-id')
        .build();
      const button = job['post'].querySelector('*[data-job-id]') as HTMLElement;
      button.addEventListener('click', () => { clicked = true; });

      job.select();

      expect(clicked).toBe(true);
    });
  });

  describe('should be able to hide and show a job', () => {
    it('should hide the job when hide is called', () => {
      const job = JobMother.create().build();
      const post = job['post'] as HTMLElement;

      job.hide();

      expect(post.style.display).toBe('none');
    });

    it('should show the job when show is called', () => {
      const job = JobMother.create().build();

      job.hide();
      job.show();

      expect(job.isHidden()).toBe(false);
    });
  });

  describe('isHidden', () => {
    it('should return true on isHidden when a job is hidden', () => {
      const job = JobMother.create().build();

      job.hide();

      expect(job.isHidden()).toBe(true);
    });

    it('should return false on isHidden when a job is not hidden', () => {
      const job = JobMother.create().build();

      expect(job.isHidden()).toBe(false);
    });
  });

  describe('isApplied', () => {
    it('should return true when job post contains "Solicitados" or "Solicitado" or "Applied"', () => {
      const post = document.createElement('div');
      post.innerHTML = '<p>Solicitados</p>';

      const job = JobMother.create().build();
      job['post'] = post;

      expect(job.isApplied()).toBe(true);
      expect(job.shouldHide(ConfigMother.create().build())).toBe(true);
    });

    it('should return false when job post does not contain applied text', () => {
      const post = document.createElement('div');
      post.innerHTML = '<p>Visto</p>';

      const job = JobMother.create().build();
      job['post'] = post;

      expect(job.isApplied()).toBe(false);
    });
  });

  describe('onDismiss', () => {
    it('should attach click listener to dismiss button and invoke callback', () => {
      const post = document.createElement('div');
      post.innerHTML = '<button type="button" aria-label="Descartar empleo «Full Stack Developer»"></button>';

      const job = JobMother.create().build();
      job['post'] = post;

      let dismissed = false;
      job.onDismiss(() => {
        dismissed = true;
      });

      const button = post.querySelector('button') as HTMLButtonElement;
      button.click();

      expect(dismissed).toBe(true);
    });
  });

  describe('getWorkplaceType', () => {
    it('should detect remote modality from location or title or post text', () => {
      const job1 = JobMother.create().withLocation('Madrid (En remoto)').build();
      const job2 = JobMother.create().withTitle('Fullstack Engineer - Remote').build();

      expect(job1.getWorkplaceType()).toBe('remote');
      expect(job2.getWorkplaceType()).toBe('remote');
    });

    it('should detect hybrid modality', () => {
      const job = JobMother.create().withLocation('Barcelona (Híbrido)').build();

      expect(job.getWorkplaceType()).toBe('hybrid');
    });

    it('should default to on-site modality when no remote/hybrid tag is found', () => {
      const job = JobMother.create().withLocation('Madrid, España').build();

      expect(job.getWorkplaceType()).toBe('on-site');
    });
  });

  describe('filtering by workplaceType', () => {
    it('should hide job when job modality is not in allowed workplaceTypes', () => {
      const job = JobMother.create().withLocation('Madrid (Presencial)').build();
      const config = ConfigMother.create().withWorkplaceTypes({
        enabled: true,
        types: ['remote', 'hybrid'],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('should keep job when job modality matches selected workplaceTypes combination', () => {
      const jobRemote = JobMother.create().withLocation('Madrid (En remoto)').build();
      const jobHybrid = JobMother.create().withLocation('Madrid (Híbrido)').build();
      const config = ConfigMother.create().withWorkplaceTypes({
        enabled: true,
        types: ['remote', 'hybrid'],
      }).build();

      expect(jobRemote.shouldHide(config)).toBe(false);
      expect(jobHybrid.shouldHide(config)).toBe(false);
    });
  });

  describe('filtering by location', () => {
    it('should hide job matching location in blacklist mode', () => {
      const job = JobMother.create().withLocation('Barcelona, España').build();
      const config = ConfigMother.create().withLocations({
        enabled: true,
        mode: 'blacklist',
        data: ['Barcelona'],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('should not hide job not matching location in blacklist mode', () => {
      const job = JobMother.create().withLocation('Madrid, España').build();
      const config = ConfigMother.create().withLocations({
        enabled: true,
        mode: 'blacklist',
        data: ['Barcelona'],
      }).build();

      expect(job.shouldHide(config)).toBe(false);
    });

    it('should hide job not matching location in whitelist mode', () => {
      const job = JobMother.create().withLocation('Barcelona, España').build();
      const config = ConfigMother.create().withLocations({
        enabled: true,
        mode: 'whitelist',
        data: ['Madrid'],
      }).build();

      expect(job.shouldHide(config)).toBe(true);
    });

    it('should keep job matching location in whitelist mode', () => {
      const job = JobMother.create().withLocation('Madrid, España').build();
      const config = ConfigMother.create().withLocations({
        enabled: true,
        mode: 'whitelist',
        data: ['Madrid'],
      }).build();

      expect(job.shouldHide(config)).toBe(false);
    });
  });
});

