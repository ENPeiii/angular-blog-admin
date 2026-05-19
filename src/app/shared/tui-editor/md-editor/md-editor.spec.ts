import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdEditor } from './md-editor';



describe('MdEditor', () => {
  let component: MdEditor;
  let fixture: ComponentFixture<MdEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MdEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
