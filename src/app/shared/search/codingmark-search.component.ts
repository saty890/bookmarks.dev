import {Observable, of as observableOf} from 'rxjs';

import {catchError, debounceTime, map, startWith, switchMap} from 'rxjs/operators';
import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Router} from '@angular/router';
import {BookmarkFilterService} from '../../core/filter.service';
import {Codingmark} from '../../core/model/codingmark';
import {List} from 'immutable';
import {languages} from '../language-options';
import {PublicCodingmarksStore} from '../../public/codingmark/store/public-codingmarks-store.service';
import {KeycloakService} from 'keycloak-angular';
import {Search, UserData} from '../../core/model/user-data';
import {MatAutocompleteSelectedEvent} from '@angular/material';
import {UserDataStore} from '../../core/user/userdata.store';

@Component({
  selector: 'app-codingmark-search',
  templateUrl: './codingmark-search.component.html',
  styleUrls: ['./codingmark-search.component.scss']
})
export class CodingmarkSearchComponent implements OnInit, AfterViewInit {

  @Input()
  codingmarks: Observable<List<Codingmark>>;

  @Input()
  query: string;

  @Input()
  context: string;

  _userData: UserData;

  filteredBookmarks: Observable<Codingmark[]>;
  private filterBookmarksBySearchTerm: Codingmark[];

  searchControl = new FormControl();
  queryText: string;
  public showNotFound = false;
  public numberOfResultsFiltered: number;
  counter = 10;
  previousTerm: string;
  language = 'all';

  languages = languages;

  userIsLoggedIn = false;
  userId: string;

  autocompleteSearches = [];
  filteredSearches: Observable<any[]>;

  constructor(private router: Router,
              private bookmarkStore: PublicCodingmarksStore,
              private bookmarkFilterService: BookmarkFilterService,
              private keycloakService: KeycloakService,
              private userDataStore: UserDataStore) {
  }

  @Input()
  set userData(userData: UserData) {
    if (userData) {
      const emptyUserData = Object.keys(userData).length === 0 && userData.constructor === Object; // = {}
      if (emptyUserData) {
        this._userData = userData; // = {}
      } else {
        this._userData = userData;
        this.autocompleteSearches = [];
        this._userData.searches.forEach(search => this.autocompleteSearches.push(search.text));
        this.filteredSearches = this.searchControl.valueChanges
          .pipe(
            startWith(null),
            map((searchText: string | null) => {
              return searchText ? this._filter(searchText) : this.autocompleteSearches.slice();
            })
          );
      }
    }
  }

  ngOnInit(): void {

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userId = keycloakProfile.id;
        });
      }
    });

    this.filteredBookmarks = this.searchControl.valueChanges.pipe(
      debounceTime(1500),
      // TODO - next line should be reactived when getting results via HTTP
      // .distinctUntilChanged()   ignore if next search term is same as previous
      switchMap(term => {
        // this.counter = 0; // we initialise the counter
        if (term) { // switch to new observable each time

          if (this.previousTerm !== term) {
            this.previousTerm = term;
            this.counter = 10;
          }

          this.queryText = term;
          this.filterBookmarksBySearchTerm = this.bookmarkFilterService.filterBookmarksBySearchTerm(term, this.language, this.codingmarks);
          this.numberOfResultsFiltered = this.filterBookmarksBySearchTerm.length;
          if (this.numberOfResultsFiltered > 0) {
            this.showNotFound = false;
            return observableOf(this.filterBookmarksBySearchTerm.slice(0, this.counter)); // get the first 10 results
          } else {
            this.showNotFound = true;
            return observableOf<Codingmark[]>([]);
          }
        } else {
          this.numberOfResultsFiltered = 0;
          // or the observable of empty codingmarks if no search term
          return observableOf<Codingmark[]>([]);
        }
      }),
      catchError(error => {
        console.log(error);
        return observableOf<Codingmark[]>([]);
      }), );

  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.autocompleteSearches.filter(option => option.toLowerCase().includes(filterValue));
  }

  showMoreResults() {
    this.searchControl.setValue(this.queryText); // trigger this.searchControl.valueChanges
    this.counter += 10;
  }

  ngAfterViewInit(): void {
    if (this.query) {
      this.searchControl.setValue(this.query);
    }
  }

  /**
   *
   * @param codingmark
   */
  gotoCodingmarkDetail(codingmark: Codingmark): void {
    const link = ['/codingmarks', codingmark._id];
    this.router.navigate(link);
  }

  setQueryFromParentComponent(queryFromOutside: string) {
    this.searchControl.setValue(queryFromOutside);
  }

  onLanguageChange(newValue) {
    console.log('onLanguageChange' + newValue);
    this.language = newValue;
    this.searchControl.setValue(this.queryText);
  }

  onSaveClick() {
    const now = new Date();
    const newSearch: Search = {
      text: this.queryText,
      createdAt: now,
      lastAccessedAt: now
    }
    const emptyUserData = Object.keys(this._userData).length === 0 && this._userData.constructor === Object;
    if (emptyUserData) {
      this._userData = {
        userId: this.userId,
        searches: [newSearch]
      }
    } else {
      this._userData.searches.unshift(newSearch);
    }
    this.userDataStore.updateUserData(this._userData).subscribe();
  }

  onSelectionChanged(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.value;
    const index = this._userData.searches.findIndex((search: Search) => search.text === selectedValue);
    const updatedSearch: Search  = this._userData.searches.splice(index, 1)[0];
    updatedSearch.lastAccessedAt = new Date();
    this._userData.searches.unshift(updatedSearch);

    this.userDataStore.updateUserData(this._userData).subscribe();
  }

}