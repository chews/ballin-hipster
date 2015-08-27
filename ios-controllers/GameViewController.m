//
//  GameViewController.m
//  WrdGme
//
//  Copyright (c) 2015 Genevieve L'Esperance. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "GameViewController.h"
#import <Parse/Parse.h>


@interface GameViewController ()

@property (weak, nonatomic) IBOutlet UITextField *wordField;

@property (weak, nonatomic) IBOutlet UILabel *scoreLabel;

@end

@implementation GameViewController

int *score;


- (void) viewDidLoad
{
    [self.wordField setText:@""];
    [self updateScore];
}

- (void) viewDidAppear:(BOOL)animated
{
    [self.wordField setText:self.currTriads[0]];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    [self validateWord:textField.text];
    return YES;
}

- (void)updateScore
{
    [self.scoreLabel setText:[NSString stringWithFormat:@"%d",[[[PFUser currentUser] objectForKey:@"score"] intValue]]];
}

- (void)validateWord:(NSString*)testWord
{
    if ([self.currWord isEqualToString:testWord])
    {
        [self.wordField setTextColor:[UIColor greenColor]];
        [self retrieveNextTriad];
    }
    else
    {
        [self.wordField setTextColor:[UIColor redColor]];
    }
    
}

- (void)retrieveNextTriad
{
    PFUser *currUser = [PFUser currentUser];
    
    [currUser incrementKey:@"score"];
    [currUser saveInBackground];
    [self updateScore];
    
    if (currUser) {
        
        PFQuery *query = [PFQuery queryWithClassName:@"WrdEntry"];
        NSArray *wordIds = [currUser objectForKey:@"gameWords"];
        
        uint32_t rnd = arc4random_uniform((int)[wordIds count]);
        NSString *currId = [wordIds objectAtIndex:rnd];
        
        [query whereKey:@"objectId" equalTo:currId];
        [query findObjectsInBackgroundWithBlock:^(NSArray *word, NSError *error)
         {
             [self.wordField setTextColor:[UIColor blackColor]];
             self.currTriads = (NSArray *) [[word firstObject] objectForKey:@"combos"];
             self.currWord = (NSString *) [[word firstObject] objectForKey:@"word"];
             
             NSLog(@"currWord: %@", self.currWord);
             [self.wordField setText:self.currTriads[0]];
             
         }];
    }
}



- (IBAction)quit:(id)sender
{
    [PFUser logOut];
    [self.navigationController popViewControllerAnimated:YES];

}



@end