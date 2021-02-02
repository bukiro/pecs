/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { SkillsService } from './skills.service';

describe('Service: Skills', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SkillsService]
    });
  });

  it('should ...', inject([SkillsService], (service: SkillsService) => {
    expect(service).toBeTruthy();
  }));
});
